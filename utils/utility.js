exports.checkKorean = function (name) {
  check = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/
  if (check.test(name)) {
    return true
  }
  return false
}

exports.isNumber = function (s) {
  s += '' // 문자열로 변환
  s = s.replace(/^\s*|\s*$/g, '') // 좌우 공백 제거
  if (s == '' || isNaN(s)) return false
  return true
}

exports.getLargeImgUrl = function (id) {
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
