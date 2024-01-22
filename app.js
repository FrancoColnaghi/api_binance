// Definir los 5 Pares a mostrar
const symbols = ["BTCUSDT","ETHUSDT","BNBUSDT","SOLUSDT","MATICUSDT"]
// Definir los 3 Intevalos de tiempo a analizar
const intervals = ["3m","15m","1h","4h"]
// ruta base para CONSULTAR PRECIO ACTUAL
var endpoint = 'https://api.binance.com/api/v3/ticker/tradingDay'

var priceSymbol = []

// Mapeo array de simbolos y realizo un fetch por cada posicion
const request = symbols.map(symbol => {
    let url = endpoint + `?symbol=${symbol}`
    return fetch(url)
        .then(response => response.json() )
        //.then(datos => createCard(datos) )
        .catch(e => console.log(e) )
})

// Realizo un forEach al array de respuestas 
Promise.all(request)
    .then(dataArray=>{
        //console.log(dataArray)
        dataArray.forEach((data,index)=>{
            llenarPrecios(data,index)
        })
    })

// funcion para agregar al tablero los Symbolos y Precios actuales
const llenarPrecios = (data,index)=>{
    // Coloca el symbolo en la etuiqueta
    let newTextSymbol = document.createTextNode(`${data.symbol}`)
    document.getElementById(`symbol-${index+1}`).appendChild(newTextSymbol)

    // Coloca el precio en la etiqueta
    let numFormat = Math.round(data.lastPrice * 10000)/10000
    let newTextprice = document.createTextNode(`${numFormat}`)
    document.getElementById(`price-${index+1}`).appendChild(newTextprice)

    // guarda los precios ordenados en el array PriceSymbol
    priceSymbol.push(numFormat)
}

setTimeout(()=>{
    console.log("dando tiempo a fetch")

//Funciones necesarias para calcular bandas de bollinger
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

var mapeoIntervalos = intervals.map(interval =>{
    //console.log(`intervalo: ${interval}`)
    const requestBoll = symbols.map((symbol,index) => {
        calcularBandasBollinger(symbol, interval, 20, 2)
        .then(data => {

            let decimals = 0;
            decimals =  symbol === "BTCUSDT" ? 5 : 
                        symbol === "ETHUSDT" ? 5 :
                        symbol === "BNBUSDT" ? 5 :
                        symbol === "SOLUSDT" ? 5 : 
                        symbol === "MATICUSDT" ? 4 : 0;
            
            let prices = []

            //banda superior
            let numFormat = Math.round(data.bandaSuperior*10000)/10000
            numFormat = numFormat.toPrecision(decimals)
            let newTextprice = document.createTextNode(`${numFormat}`)
            document.getElementById(`s${index+1}-${interval}-sup`).appendChild(newTextprice)
            prices.push(numFormat)
            
            //banda sma
            numFormat = Math.round(data.sma * 10000)/10000
            numFormat = numFormat.toPrecision(decimals)
            newTextprice = document.createTextNode(`${numFormat}`)
            document.getElementById(`s${index+1}-${interval}-sma`).appendChild(newTextprice)
            prices.push(numFormat)
            
            
            //banda inferior
            numFormat = Math.round(data.bandaInferior * 10000)/10000
            numFormat = numFormat.toPrecision(decimals)
            newTextprice = document.createTextNode(`${numFormat}`)
            document.getElementById(`s${index+1}-${interval}-inf`).appendChild(newTextprice)
            prices.push(numFormat)
            
            
            Pintar(index,interval,prices);

        })
        .catch(error => console.error(error));
    })
})

const Pintar = (index, interval, prices) => {
    //console.log(`index: ${index} - precio: ${priceSymbol[index]}, intervalo: ${interval}, precios: ${prices[0]}, ${prices[1]}, ${prices[2]}`)

    if (priceSymbol[index] > prices[0]) {
        document.getElementById(`s${index+1}-${interval}-m1`).classList.add("pintado")
        console.log("ejecutado")
    } else {
        if (priceSymbol[index] > prices[1]) {
            document.getElementById(`s${index+1}-${interval}-m2`).classList.add("pintado")
        } else {
            if (priceSymbol[index] > prices[2]) {
                document.getElementById(`s${index+1}-${interval}-m3`).classList.add("pintado")
            } else {
                    document.getElementById(`s${index+1}-${interval}-m4`).classList.add("pintado")
            }
        }
    }

    // Amplitud de bandas y Distancia a SMA
    let amplitudBLL = ((prices[0]-prices[2])/prices[1])*100
    amplitudBLL = amplitudBLL.toPrecision(3)
    let newTextprice = document.createTextNode(`${amplitudBLL} %`)
    document.getElementById(`s${index+1}-${interval}-amp`).appendChild(newTextprice)

    let lastPrice = document.getElementById(`price-${index+1}`).innerText
    lastPrice = parseFloat(lastPrice)
    let distanciaSMA = ((lastPrice-prices[1])/prices[1])*100
    distanciaSMA = distanciaSMA.toPrecision(3)
    newTextprice = document.createTextNode(`${distanciaSMA} %`)
    document.getElementById(`s${index+1}-${interval}-dis`).appendChild(newTextprice)    
};

console.log(priceSymbol)

},1000)