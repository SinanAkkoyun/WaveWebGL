"use strict"

;(async () => {
  //fetch no cache
  let headers = new Headers()
  headers.append('pragma', 'no-cache')
  headers.append('cache-control', 'no-cache')
  let headerInit = {
    method: 'GET',
    headers: headers,
  }

  let vertexShaderSource = await (await fetch('/shader.vert', headerInit)).text()
  let fragmentShaderSource = await (await fetch('/shader.frag', headerInit)).text()

  let canvas = document.querySelector("#c") // Get A WebGL context
  let gl = canvas.getContext("webgl2")
  if (!gl)
    return

  let program = webglUtils.createProgramFromSources(gl, [vertexShaderSource, fragmentShaderSource]) // Use our boilerplate utils to compile the shaders and link into a program
  let positionAttributeLocation = gl.getAttribLocation(program, "a_position") // look up where the vertex data needs to go.
  const locations = new Map()
  const locStr = ["u_resolution", "u_color", "ratio", "frequency", "pos_offset", "num", "thresh", "gitter", "thickness", "sphereS", "scale"] //needs ES6 for good looking
  locStr.map(loc => {
    locations.set(loc, gl.getUniformLocation(program, loc))
  })
  const glloc = (uniformname) => locations.get(uniformname)

  
  let positionBuffer = gl.createBuffer() // Create a buffer
  let vao = gl.createVertexArray() // Create a vertex array object (attribute state)
  gl.bindVertexArray(vao) // and make it the one we're currently working with
  gl.enableVertexAttribArray(positionAttributeLocation) // Turn on the attribute
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer) // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  let translation = [0, 0]
  let frequency = 100
  let iteration = 1
  let threshold = 0
  let thickness = 1
  let size = 2;          // 2 components per iteration
  let type = gl.FLOAT;   // the data is 32bit floats
  let normalize = false; // don't normalize the data
  let stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  let offset = 0;        // start at the beginning of the buffer
  let color = [255,0,0]
  let gitter = 1
  let sphere = 0
  let scale = 1
  
  webglLessonsUI.setupSlider("#scale", {slide: (event, ui) => { scale = ui.value / 10; drawScene(); }, max: 100, min: 10 })
  const updatePosition = (index) => { (event, ui) => { translation[index] = ui.value/1000; drawScene(); }}
  webglLessonsUI.setupSlider("#x", {slide: updatePosition(0), max: 1000 })
  webglLessonsUI.setupSlider("#y", {slide: updatePosition(1), max: 1000 })
  webglLessonsUI.setupSlider("#frequency", {slide: (event, ui) => { frequency = ui.value*5; drawScene(); }, max: 100, min: 1 })
  webglLessonsUI.setupSlider("#numofsources", {slide: (event, ui) => { iteration = ui.value**2; drawScene(); }, max: 25, min: 1 })
  webglLessonsUI.setupSlider("#thresh", {slide: (event, ui) => { threshold = ui.value/100000; drawScene(); }, max: 100000 })
  webglLessonsUI.setupSlider("#thickness", {slide: (event, ui) => { thickness = ui.value; drawScene(); }, max: 10, min:1 })
  webglLessonsUI.setupSlider("#gitter", {slide: (event, ui) => { gitter = ui.value; drawScene(); }, max: 100, min: 1 })
  webglLessonsUI.setupSlider("#sphere", {slide: (event, ui) => { sphere = ui.value; drawScene(); }, max: 1, min: 0 })

  Coloris({
    el: '.coloris',
    themeMode: 'dark',
    format: 'rgb',
    swatches: [ '#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51', '#d62828', '#023e8a', '#0077b6', '#0096c7', '#00b4d8', '#48cae4' ]
  })
  document.addEventListener('coloris:pick', event => {
    let colorarr = (event.detail.color.replace(/[^0-9,]/g, '') + ',1').split(',').map(Number)
    color = colorarr
    drawScene()
  })

  gl.vertexAttribPointer(
      positionAttributeLocation, size, type, normalize, stride, offset)


  function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height) // Tell WebGL how to convert from clip space to pixels
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT) // Clear the canvas
    gl.useProgram(program) // Tell it to use our program (pair of shaders)
    gl.bindVertexArray(vao) // Bind the attribute/buffer set we want.
    gl.uniform2f(glloc('u_resolution'), gl.canvas.width, gl.canvas.height) // Pass in the canvas resolution so we can convert from pixels to clipspace in the shader

    setRectangle(gl, 0, 0, gl.canvas.width, gl.canvas.height)

    gl.uniform2f(glloc('pos_offset'), translation[0], translation[1])
    gl.uniform1f(glloc('frequency'), frequency)
    gl.uniform1f(glloc('thickness'), thickness)
    gl.uniform1i(glloc('num'), iteration)
    gl.uniform1f(glloc('thresh'), threshold)
    gl.uniform1f(glloc('ratio'), gl.canvas.width/gl.canvas.height)
    gl.uniform1i(glloc('gitter'), gitter)
    gl.uniform4f(glloc('u_color'), color[0], color[1], color[2], color[3])
    gl.uniform1i(glloc('sphereS'), sphere)
    gl.uniform1f(glloc('scale'), scale)

    let primitiveType = gl.TRIANGLES
    let offset = 0
    let count = 6
    gl.drawArrays(primitiveType, offset, count)
  }
  drawScene()

  // Fill the buffer with the values that define a rectangle.
  function setRectangle(gl, x, y, width, height) {
    let x1 = x
    let x2 = x + width
    let y1 = y
    let y2 = y + height
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      x1, y1,
      x2, y1,
      x1, y2,
      x1, y2,
      x2, y1,
      x2, y2,
    ]), gl.STATIC_DRAW)
  }
})()