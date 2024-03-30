import { Server } from 'socket.io'
import { createServer } from 'http'
import pngparse from "pngparse"
import floydSteinberg from 'floyd-steinberg'

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

function createImageData(image) {
  var buf = new Buffer(image.width * image.height * 4);

  var l = image.data.length;
  var pos = 0;
  for (var y = 0; y < image.height; y++) {
    for (var x = 0; x < image.width; x++) {
      buf.writeUInt32BE(image.getPixel(x, y), pos);
      pos += 4;
    }
  }

  image.data = buf;

  return image;
}

io.on('connection', (socket) => {
  socket.on('data', data => {
    pngparse.parse(Buffer.from(data.split(';base64,').pop(), 'base64'), (err, data) => {
      var pimage = createImageData(data);

      var pixels = pimage.data,
          pixelsLen = pixels.length,
          height = pimage.height,
          width = pimage.width,
          alpha = pimage.hasAlphaChannel,
          threshold = 120,
          unpackedBuffer = [],
          depth = 4;

      var buffer = new Buffer(width * Math.ceil(height / 8));
      buffer.fill(0x00);

      floydSteinberg(pimage)

      for (var i = 0; i < pixelsLen; i += depth) {
        var pixelVal = pixels[i + 1] = pixels[i + 2] = pixels[i];

          if (pixelVal > threshold) {
            pixelVal = 1;
          } else {
            pixelVal = 0;
          }

        unpackedBuffer[i/depth] = pixelVal
      }

      for (var i = 0; i < unpackedBuffer.length; i++) {
        var x = Math.floor(i % width);
        var y = Math.floor(i / width);

        var byte = 0,
            page = Math.floor(y / 8),
            pageShift = 0x01 << (y - 8 * page);

        (page === 0) ? byte = x : byte = x + width * page; 
        
        if (unpackedBuffer[i] === 0) {
          buffer[byte] &= ~pageShift;
          
        } else {
          buffer[byte] |= pageShift;
        }
      }
    
      io.sockets.emit('data-out', buffer)
    })
  })
})

httpServer.listen(3000);