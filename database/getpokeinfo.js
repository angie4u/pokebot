require('dotenv-extended').load()
const mysql = require('promise-mysql')
const utility = require('../utils/utility')

module.exports = function getPokeInfo (input) {
  var datatype = ''
  var param = []

  if (utility.isNumber(input)) {
    datatype = 'id'
    input = parseInt(input)
  } else if (utility.checkKorean(input)) {
    datatype = 'name_kor'
  } else {
    datatype = 'name_eng'
  }

  var sql = 'SELECT * FROM pokeinfo WHERE ' + datatype + '=?'
  console.log(sql)

  param.push(input)
  console.log(input)
    // pre process user input

  mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  }).then(function (conn) {
    return conn.query(sql, param)
  }).then(function (input) {
      // console.log(dc.context.activity.channelId)

    var pokemonInfo = input[0]
    return pokemonInfo
  }).catch(function (error) {
    console.log('There was an ERROR: ', error)
  })
}
