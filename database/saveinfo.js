require('dotenv-extended').load()

const mysql = require('mysql')
const utility = require('../utils/utility')

const Pokedex = require('pokedex-promise-v2')
const P = new Pokedex()
var pokemonInfo = {}
var params = []
var sql = 'INSERT INTO pokeinfo (id, name_eng, name_kor, color, genra, imgUrl_large) VALUES ?'
var startIndex = 430
var endIndex = 470

var promiseArray = []
for (var i = startIndex; i < endIndex; i++) {
  promiseArray.push(P.getPokemonSpeciesByName(i))
}

Promise.all(promiseArray).then(function (result) {
  console.log(result)

  for (var i in result) {
    var response = result[i]
    pokemonInfo.color = response.color.name
    pokemonInfo.id = response.id
    pokemonInfo.name_eng = response.name

    var nameobj = response.names.filter(function (obj) { return obj.language.name === 'ko' })
    pokemonInfo.name_kor = nameobj[0].name

    var generaobj = response.genera.filter(function (obj) { return obj.language.name === 'ko' })
    pokemonInfo.genera = generaobj[0].genus

    pokemonInfo.imageUrl_large = utility.getLargeImgUrl(pokemonInfo.id)

    params.push([pokemonInfo.id, pokemonInfo.name_eng, pokemonInfo.name_kor, pokemonInfo.color, pokemonInfo.genera, pokemonInfo.imageUrl_large])// 파라미터를 값들로 줌(배열로 생성)
  }
  return params
}).then((params) => {
  console.log(params)
  conn.query(sql, [params], function (err, result) { // 쿼리문 두번째 인자로 파라미터로 전달함(값들을 치환시켜서 실행함. 보안과도 밀접한 관계가 있음(sql injection attack))
    if (err) console.log(err)
  })
}).catch(function (error) {
  console.log(error)  // logs 'failure.'
})

var conn = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
})
