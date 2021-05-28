const roundPoint = (number: number) => Math.round(number * 10) / 10;
const formatNumber = (number: number) => number.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');

export { formatNumber, roundPoint };
