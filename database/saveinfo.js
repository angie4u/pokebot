require('dotenv-extended').load()

const mysql = require('mysql')
var conn = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
})

const Pokedex = require('pokedex-promise-v2')
const P = new Pokedex()
var pokemonInfo = {}
// var i = '1'
function startRequest (i) {
// for (var i = 27; i < 49; i++) {

  P.getPokemonSpeciesByName(i) // with Promise
    .then(function (response) {
      console.log('response: ' + response)

      pokemonInfo.color = response.color.name
      pokemonInfo.id = response.id
      pokemonInfo.name_eng = response.name
    // pokemonInfo.habitat = response.habitat.name

      var nameobj = response.names.filter(function (obj) { return obj.language.name === 'ko' })
      pokemonInfo.name_kor = nameobj[0].name

      var generaobj = response.genera.filter(function (obj) { return obj.language.name === 'ko' })
      pokemonInfo.genera = generaobj[0].genus
        // console.log(pokemonInfo)
      return pokemonInfo
    })
    .then(function (pokemonInfo) {
      pokemonInfo.imageUrl_large = getLargeImgUrl(pokemonInfo.id)
    // const message = CardFactory.adaptiveCard(infoCard(pokemonInfo.imageUrl_large, pokemonInfo.name_kor, pokemonInfo.id, pokemonInfo.name_eng, pokemonInfo.genera, pokemonInfo.habitat, pokemonInfo.color))

      var sql = 'INSERT INTO pokeinfo (id, name_eng, name_kor, color, genra, imgUrl_large) VALUES(?,?,?,?,?,?)'
      var params = [pokemonInfo.id, pokemonInfo.name_eng, pokemonInfo.name_kor, pokemonInfo.color, pokemonInfo.genera, pokemonInfo.imageUrl_large]// 파라미터를 값들로 줌(배열로 생성)
      conn.query(sql, params, function (err, rows, fields) { // 쿼리문 두번째 인자로 파라미터로 전달함(값들을 치환시켜서 실행함. 보안과도 밀접한 관계가 있음(sql injection attack))
        if (err) console.log(err)
        // console.log(rows.insertId)
      })
    // }
    })
    .catch(function (error) {
      console.log('There was an ERROR: ', error)
    })
// }
}

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
