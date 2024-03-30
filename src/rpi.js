const { io } = require("socket.io-client")
    , i2c = require('i2c-bus')
    , Oled = require('oled-i2c-bus')

const opts = {
  width: 128,
  height: 64,
  address: 0x3C,
  bus: 1,
  driver: "SSD1306"
}

const i2cbus = i2c.openSync(opts.bus)
    , oled = new Oled(i2cbus, opts)

oled.clearDisplay()

oled.turnOnDisplay()

var socket = io.connect('http://192.168.50.102:3000')

socket.on('connect', function () {
  socket.on('data-out', bitmap => {
    try {
      oled.buffer = bitmap;
      oled.update()
    } catch (e) {
    }
  })
})