const numUtils = {};

function toNumber(string){
  return Number(string.replace(/,/g,""));
}

function addComma(number){
  return number.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}

numUtils.toNumber = toNumber;
numUtils.addComma = addComma;

module.exports = numUtils;