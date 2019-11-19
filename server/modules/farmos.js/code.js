const valueUnit = {
    1: '℃',
    2: '%',
    3: 'ppm',
    4: 'W/m2',
    5: '°',
    6: '㎧',
    7: '',
    8: 'µmol/m2/s',
    9: '%vol.',
    10: '㎪',
    11: 'dS/m',
    12: '㏗',
    13: '℃',
    14: 'L',
    15: 'V',
    16: 'A',
    17: 'mm'
}

exports.getValueCode = function (code) {
    if (valueUnit.hasOwnProperty(code)) {
        return valueUnit[code]
    } else {
        return code
    }
}
