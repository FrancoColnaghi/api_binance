const symbols = ["BTCUSDT","ETHUSDT","BNBUSDT","SOLUSDT","MATICUSDT"]

// CONSULTAR PRECIO ACTUAL
let endpoint = 'https://api.binance.com/api/v3/ticker/tradingDay'
let body = ''
let symbol = ''

const request = symbols.map(symbol => {
    let url = endpoint + `?symbol=${symbol}`
    return fetch(url)
        .then(response => response.json() )
        //.then(datos => createCard(datos) )
        .catch(e => console.log(e) )
})

Promise.all(request)
.then(dataArray=>{
        console.log(dataArray)
        dataArray.forEach((data,index)=>{
            createCard(data)
        })
    })

/*
const mostrarData = (data)=>{
    //console.log(data)
    let numFormat = Math.round(data.lastPrice * 10000)/10000
    body += `<tr><td>${data.symbol}</td><td>${numFormat}</td></tr>`;
    document.getElementById('data').innerHTML = body;
}
*/

const createCard = (data)=>{
    console.log(data)

    //crear nueva tarjeta
    var newCard = document.createElement('div')
    newCard.setAttribute("class",`card card${data.symbol}`);

    var newSymbol = document.createElement('div')
    newSymbol.setAttribute("class",`symbol symbol${data.symbol}`)
    var newTextSymbol = document.createTextNode(`${data.symbol}`)

    var newPrice = document.createElement('div')
    newPrice.setAttribute("class",`price price${data.symbol}`)
    let numFormat = Math.round(data.lastPrice * 10000)/10000
    var newTextprice = document.createTextNode(`${numFormat}`)
    //document.querySelector(`.card${data.symbol}`).appendChild(newSymbol)
    
    //let symbolHTML = `<h2>${data.symbol}</h2>`
    
    //agregar nueva tarjeta al contenedor principal
    document.querySelector('.container-card').appendChild(newCard)

    document.querySelector(`.card${data.symbol}`).appendChild(newSymbol)
    document.querySelector(`.symbol${data.symbol}`).appendChild(newTextSymbol)
    
    document.querySelector(`.card${data.symbol}`).appendChild(newPrice)
    document.querySelector(`.price${data.symbol}`).appendChild(newTextprice)
}
// -----------------------------------------------------------------------

const calcularBandasBollinger = async (symbol, interval, periodo, multiplicador) => {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${periodo}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        const cierres = data.map(candle => parseFloat(candle[4])); // Precios de cierre

        const sma = calcularSMA(cierres, periodo);
        const desviacionEstandar = calcularDesviacionEstandar(cierres, periodo);

        const bandaSuperior = sma.map((valor, i) => valor + multiplicador * desviacionEstandar[i]);
        const bandaInferior = sma.map((valor, i) => valor - multiplicador * desviacionEstandar[i]);

        return { sma, bandaSuperior, bandaInferior };
    } catch (error) {
        console.error('Error al obtener datos de la API de Binance:', error);
        throw error;
    }
};

const calcularSMA = (cierres, periodo) => {
    const sma = [];
    for (let i = 0; i < cierres.length - periodo + 1; i++) {
        const suma = cierres.slice(i, i + periodo).reduce((total, precio) => total + precio, 0);
        sma.push(suma / periodo);
    }
    return sma;
};

const calcularDesviacionEstandar = (cierres, periodo) => {
    const sma = calcularSMA(cierres, periodo);
    const diferenciasCuadradas = cierres.map((precio, i) => (precio - sma[i % sma.length]) ** 2);
    const sumaDiferenciasCuadradas = calcularSMA(diferenciasCuadradas, periodo);
    const desviacionEstandar = sumaDiferenciasCuadradas.map(valor => Math.sqrt(valor));
    return desviacionEstandar;
};

// uso
const symbolBB = 'BNBUSDT';
const interval = '1h'; // Intervalo de tiempo, por ejemplo: '1m' (1 minuto), '1h' (1 hora)
const periodo = 20; // Número de períodos para la SMA y la desviación estándar
const multiplicador = 2; // Puedes ajustar este valor según la volatilidad deseada

calcularBandasBollinger(symbolBB, interval, periodo, multiplicador)
    .then(bandasBollinger => console.log(bandasBollinger))
    .catch(error => console.error(error));