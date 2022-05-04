#version 300 es

precision highp float;

in vec2 uv;
out vec4 outColor;

uniform vec2 pos_offset;
uniform int num,gitter,sphereS;
uniform float ratio,frequency,thresh,thickness;
uniform vec4 u_color;

vec2 st;
float wavelength;
float pi = 3.1415926535897932384626433832795;

float map(float x) {
  return (x*0.5 + 0.5);
}

float lerp(float a, float b, float c) {
  return a + (b-a)*c;
}

float wave(vec2 pos, float wavelength, float phase) {
  return sin( ((1.0-length(st-pos)) + (phase*pi)/2.0 )/wavelength);
}
float sphere(vec2 pos, float wavelength, float phase) {
  return float((1.0-length(st-pos)) > 0.995);
}

float interference(int n, int g) {
  float val;
  for(int gi=0;gi<g;gi++) {
    for(int i=0;i<n;i++) {
      // val += wave(vec2((float(i)/float(n))*2.0-1.0, -(float(gi)/float(n))*2.0), wavelength, 0.0);
      val += (sphereS > 0 ? sphere(vec2((float(i)/float(n))*2.0-1.0, -(float(gi)/float(n))*2.0), wavelength, 0.0) : wave(vec2((float(i)/float(n))*2.0-1.0, -(float(gi)/float(n))*2.0), wavelength, 0.0));
    }
  }
  return val;// / float(n*g);
}

void main() {
  st = vec2(uv.x*ratio, uv.y);
  st *= 5.0;
  wavelength = 1.0 / frequency;
  float bright = map(interference(num, gitter));
  vec3 wavecolor = (u_color.xyz/255.0) * (bright);
  outColor = vec4((thresh <= 0.0 ? wavecolor : (u_color.xyz/255.0) * float(bright > thresh)), 1);
}