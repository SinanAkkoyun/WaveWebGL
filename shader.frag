#version 300 es

precision highp float;

in vec2 uv;
out vec4 outColor;

uniform vec2 pos_offset;
uniform int num,gitter,sphereS;
uniform float ratio,frequency,thresh,thickness,scale,speed,time;
uniform vec4 u_color;

vec2 st;
float wavelength;
float pi = 3.1415926535897932384626433832795;

//x,y,freq,phase
vec4 lines[1] = vec4[6](vec4(-0.8, 0.9, -0.9, 0.85));

vec4 objVertices[1] = vec4[1](vec4(-0.75, -0.5, 0.75, -0.95));

float map(float x) {
  return (x*0.5 + 0.5);
}

float sphere(vec2 pos, float wavelength, float phase) {
  return float((1.0-length(st-pos)) > 0.995);
}
float wave(vec2 pos, float wavelength, float phase) {
  if(sphereS > 0) {
    return sphere(pos, wavelength, phase);
  }
  return sin( ((1.0-length(st-pos)) + (phase*pi)/2.0 )/wavelength);
}
float obj(vec4 vertices) {
  return (st.x > vertices.x && st.x < vertices.z) && (st.y < vertices.y && st.y > vertices.w) ? 1.0 : 0.0;
}

float interference(int n, int g) {
  float phase = time/1000.0/speed;
  float val;
  for(int gi=0;gi<g;gi++) {
    for(int i=0;i<n;i++) {
      // val += wave(vec2((float(i)/float(n))*2.0-1.0, -(float(gi)/float(n))*2.0), wavelength, 0.0);
      val += (sphereS > 0 ? sphere(vec2((float(i)/float(n))*2.0-1.0, -(float(gi)/float(n))*2.0), wavelength, phase) : wave(vec2((float(i)/float(n))*2.0-1.0, -(float(gi)/float(n))*2.0), wavelength, phase));
    }
  }
  return val;// / float(n*g);
}

float linewave(vec4 points, int divisions) {
  float out=0;
  for(int i=0;i<divisions;i++) {
    out += wave(mix(points, points, float(i)/float(divisions)), wavelength, 0.0);
  }
  return out;
}

void main() {
  st = vec2(uv.x*ratio, uv.y);
  st *= scale;
  wavelength = 1.0 / frequency;

  float bright = 0.0;

  bright += linewave(lines[0], 10);
  vec3 wavecolor = (u_color.xyz/255.0) * (bright);
  wavecolor = mix(wavecolor, vec3(0.0, 1.0, 1.0), obj(objVertices[0]));

  outColor = vec4(wavecolor, 1);
  /*
  float bright = map(interference(num, gitter));
  vec3 wavecolor = (u_color.xyz/255.0) * (bright);
  outColor = vec4((thresh <= 0.0 ? wavecolor : (u_color.xyz/255.0) * float(bright > thresh)), 1);
  */
}