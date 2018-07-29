module.exports = function createInfoCard (imgUrl, name_kor, id, name_eng, genera, color) {
  var infoCard = {
    '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
    'type': 'AdaptiveCard',
    'version': '1.0',
    'body': [
      {
        'type': 'ColumnSet',
        'columns': [
          {
            'type': 'Column',
            'items': [
              {
                'type': 'Image',
                'url': imgUrl
              }
            ]
          },
          {
            'type': 'Column',
            'items': [
              {
                'type': 'TextBlock',
                'text': name_kor,
                'weight': 'bolder',
                'size': 'large'
              },
              {
                'type': 'FactSet',
                'separator': 'true',
                'facts': [
                  {
                    'title': '번호:',
                    'value': id
                  }
                ]
              },
              {
                'type': 'FactSet',
                'facts': [
                  {
                    'title': '영문명:',
                    'value': name_eng
                  }
                ]
              },
              {
                'type': 'FactSet',
                'facts': [
                  {
                    'title': '종류:',
                    'value': genera
                  }
                ]
              },
              {
                'type': 'FactSet',
                'facts': [
                  {
                    'title': '색상:',
                    'value': color
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
  return infoCard
}
