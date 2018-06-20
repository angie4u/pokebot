const { BotFrameworkAdapter, MemoryStorage, ConversationState, MessageFactory, ActionTypes, CardFactory } = require('botbuilder')
const restify = require('restify')
const botbuilder_dialogs = require('botbuilder-dialogs')
const dialogs = new botbuilder_dialogs.DialogSet()
let infoCard = require('./cards/infoCard')
const Pokedex = require('pokedex-promise-v2')
const P = new Pokedex()
require('dotenv-extended').load()

// Create server
let server = restify.createServer()
server.listen(process.env.port || process.env.PORT || 3978, function () {
  console.log(`${server.name} listening to ${server.url}`)
})

// Create adapter
const adapter = new BotFrameworkAdapter({
  appId: process.env.MICROSOFT_APP_ID,
  appPassword: process.env.MICROSOFT_APP_PASSWORD
})

// Add conversation state middleware
const conversationState = new ConversationState(new MemoryStorage())
adapter.use(conversationState)

function getLargeImgUrl (id) {
  var formattedNumber
  if (id < 10) {
    formattedNumber = ('00' + id).slice(-3)
  } else if (id < 100) {
    formattedNumber = ('0' + id).slice(-3)
  } else {
    formattedNumber = id
  }
  var url = 'https://assets.pokemon.com/assets/cms2/img/pokedex/full/' + formattedNumber + '.png'
  return url
}

// Listen for incoming requests
server.post('/api/messages', (req, res) => {
    // Route received request to adapter for processing
  adapter.processActivity(req, res, async (context) => {
    const isMessage = (context.activity.type === 'message')
        // State will store all of your information
    const convo = conversationState.get(context)
    const dc = dialogs.createContext(context, convo)

    if (context.activity.type === 'conversationUpdate' && context.activity.membersAdded[0].name !== 'Bot') {
      await context.sendActivity(`안녕하세요! Pokemon 정보를 조회할 수 있는 봇 입니다. 원하는 서비스를 선택하세요!
      <br/>1. 포켓몬 검색
      <br/>2. 포켓몬 진화단계 조회
      <br/>예를들어 '1'입력 시 검색서비스가 제공됩니다`)
    } else if (context.activity.type === 'message') {
      if (context.activity.text.match(/안녕/ig)) {
        await dc.begin('greetings')
      } else if ((convo.dialogStack.length == '0' && context.activity.text === '1') || context.activity.text.match(/검색/ig)) {
        // need to check dialogStack.length - if it is not, it conflicts with searchPokemon input id == 1
        await dc.begin('searchPokemon')
      } else if ((convo.dialogStack.length == '0' && context.activity.text === '2') || context.activity.text.match(/진화/ig)) {
        await dc.begin('evolutionStage')
      }
    }

    if (!context.responded) {
        // Continue executing the "current" dialog, if any.
      await dc.continue()

      if (!context.responded && isMessage) {
            // Default message
        await context.sendActivity(`원하는 서비스를 선택하세요!
          <br/>1. 포켓몬 검색
          <br/>2. 포켓몬 진화단계 조회
          <br/>예를들어 '1'입력 시 검색서비스가 제공됩니다`)
      }
    }
  })
})

// Define prompts
// Generic prompts
dialogs.add('textPrompt', new botbuilder_dialogs.TextPrompt())
dialogs.add('dateTimePrompt', new botbuilder_dialogs.DatetimePrompt())
dialogs.add('partySizePrompt', new botbuilder_dialogs.NumberPrompt())

// Greet user:
// Ask for the user name and then greet them by name.
dialogs.add('greetings', [
  async function (dc) {
    await dc.prompt('textPrompt', '안녕하세요! 이름이 뭐에요?')
  },
  async function (dc, results) {
    var userName = results
    await dc.context.sendActivity(`${userName}님, 만나서 반갑습니다!`)
    await dc.end() // Ends the dialog
  }
])

var pokemonInfo = {}
dialogs.add('searchPokemon', [
  async function (dc, args, next) {
    // need to check if this is second round
    pokemonInfo = {}

    if (typeof args !== 'undefined' && args) {
      await next(args)
    } else {
      await dc.context.sendActivity('포켓몬 검색 서비스입니다.')
      await dc.prompt('textPrompt', `포켓몬 id 혹은 이름을 입력해주세요! 현재 이름검색은 영문명만 지원합니다. :-(
        <br/>id의 경우 1~151 사이의 숫자를 입력해주세요!`)
    }
  },
  async function (dc, result) {
    await P.getPokemonSpeciesByName(result) // with Promise
        .then(function (response) {
          pokemonInfo.color = response.color.name
          pokemonInfo.id = response.id
          pokemonInfo.name_eng = response.name
          pokemonInfo.habitat = response.habitat.name

          var nameobj = response.names.filter(function (obj) { return obj.language.name === 'ko' })
          pokemonInfo.name_kor = nameobj[0].name

          var generaobj = response.genera.filter(function (obj) { return obj.language.name === 'ko' })
          pokemonInfo.genera = generaobj[0].genus

          return pokemonInfo
        }).then(function (pokemonInfo) {
          pokemonInfo.imageUrl_large = getLargeImgUrl(pokemonInfo.id)
          const message = CardFactory.adaptiveCard(infoCard(pokemonInfo.imageUrl_large, pokemonInfo.name_kor, pokemonInfo.id, pokemonInfo.name_eng, pokemonInfo.genera, pokemonInfo.habitat, pokemonInfo.color))

          dc.context.sendActivity({ attachments: [message] })
        }).catch(function (error) {
          console.log('There was an ERROR: ', error)
        })
    await dc.prompt('textPrompt', `검색하고 싶은 포켓몬 id를 입력해주세요! 처음으로 돌아가시려면 '그만'을 입력해주세요`)
  }, async function (dc, result) {
    if (result == '그만') {
      return dc.end()
    }
    return dc.replace('searchPokemon', result)
  }
])

var evolutionInfo = {}
dialogs.add('evolutionStage', [
  async function (dc, args, next) {
    evolutionInfo = {}

    if (typeof args !== 'undefined' && args) {
      await next(args)
    } else {
      await dc.context.sendActivity('포켓몬의 진화 과정을 안내해드립니다.')
      await dc.prompt('textPrompt', '진화 단계가 궁금한 포켓몬의 id 혹은 이름을 입력해주세요!')
    }
  },
  async function (dc, result, evolutionId) {
    await P.getPokemonSpeciesByName(result)
    .then(function (result) {
      evolutionInfo.is_baby = result.is_baby

      var evolutionChainUrl = result.evolution_chain.url
      var evolutionId = evolutionChainUrl.replace('https://pokeapi.co/api/v2/evolution-chain/', '').replace('/', '')
      return P.getEvolutionChainById(evolutionId)
    }).then(function (result2) {
      var evolutionStage = []

      function evolutionTree (obj) {
        if (typeof obj === 'undefined') {
          console.log('end of tree')
        } else {
          var pokemonInfo = new Object()
          pokemonInfo.name = obj.species.name
          pokemonInfo.id = obj.species.url.replace('https://pokeapi.co/api/v2/pokemon-species/', '').replace('/', '')
          pokemonInfo.url = getLargeImgUrl(pokemonInfo.id)
          evolutionStage.push(pokemonInfo)
          evolutionTree(obj.evolves_to[0])
        }
      }
      evolutionTree(result2.chain)

      var attachments = []
      evolutionStage.forEach(function (data) {
        var card = CardFactory.heroCard(data.id, [data.url], [data.name])
        attachments.push(card)
      }, this)

      let messageWithCarouselOfCards = MessageFactory.carousel(attachments)
      dc.context.sendActivity(messageWithCarouselOfCards)
      // dc.end()
    }).catch(function (error) {
      console.log('There was an ERROR: ', error)
    })
    await dc.prompt('textPrompt', `진화과정이 궁금한 포켓몬 id를 입력해주세요! 처음으로 돌아가시려면 '그만'을 입력해주세요`)
  }, async function (dc, result) {
    if (result == '그만') {
      return dc.end()
    }
    return dc.replace('evolutionStage', result)
  }
])
