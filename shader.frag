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
vec4 lines[1] = vec4[1](vec4(-0.8, 0.89, -0.9, 0.85));
vec4 objVertices[1] = vec4[1](vec4(-0.75, -0.5, 0.75, -0.95));

float map(float x) {
  return (x*0.5 + 0.5);
}

float sphere(vec2 pos, float wavelength, float phase) {
  return float((1.0-length(st-pos)) > 0.995);
}

float obj(vec4 vertices) {
  return (st.x > vertices.x && st.x < vertices.z) && (st.y < vertices.y && st.y > vertices.w) ? 1.0 : 0.0;
}

float opticalDensity(vec2 pos) {
  return mix(1.0, 1.8, obj(objVertices[0]));
}

float wave(vec2 pos, float wavelength, float phase, float maxDist) {
  if(sphereS > 0) {
    return sphere(pos, wavelength, phase);
  }
  if(length(st-pos) > maxDist)
    return 0.0;
  return sin( ((1.0-length(st-pos)) * opticalDensity(pos) + phase )/wavelength);
}

float wave(vec2 pos, float wavelength, float phase) {
  return wave(pos, wavelength, phase, 9999.0);
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

float distancew(vec2 a, vec2 b) {
  return length(b-a);
}

float linewavefront(vec4 points, int divisions) {
  float linebright=0.0;
  for(int i=0;i<divisions;i++) {
    linebright += wave(mix(points.xy, points.zw, float(i)/float(divisions)), wavelength, 0.0);
  }
  return linebright;
}

float linewavefrontphase(vec4 points, int divisions, float phase1, float phase2) {
  float linebright=0.0;
  for(int i=0;i<divisions;i++) {
    float lel = float(i)/float(divisions);
    linebright += wave(mix(points.xy, points.zw, lel), wavelength, mix(phase2, phase1, lel));
  }
  return linebright;
}

//x,y,dist
vec3 lineraycast(vec2 point, vec2 normal) {
  vec3 hit; //x,y,dist
  for(int i=0; i<1; i++) {
    float m = normal.x/normal.y;
    vec2 hitPos = vec2((objVertices[i].y - point.y) * m + point.x, objVertices[i].y);
    float newDist = distancew(point.xy, hitPos);
    if(newDist < distancew(point.xy, hit.xy) || i < 1) {
      hit = vec3(hitPos, newDist);
    }
  }

  return hit;
}

vec2 orthogonal(vec2 a) {
  return vec2(-a.y, a.x);
}

void main() {
  lines[0] = vec4(lines[0].x, lines[0].y + thickness, lines[0].zw);

  st = vec2(uv.x*ratio, uv.y);
  st *= scale;
  wavelength = 1.0 / frequency;

  float bright = 0.0;


  vec3 ray = lineraycast(lines[0].xy, orthogonal(lines[0].xy - lines[0].zw));
  vec3 ray2 = lineraycast(lines[0].zw, orthogonal(lines[0].xy - lines[0].zw));
  bright += linewavefront(lines[0], 200);
  bright = mix(bright, 0.0, obj(objVertices[0]));

  bright += linewavefrontphase(vec4(ray.xy, ray2.xy), 200, ray.z * thresh, ray2.z * thresh);

  vec3 wavecolor = (u_color.xyz/255.0) * (bright);
  wavecolor = mix(wavecolor, vec3(0.0, 1.0, 1.0), obj(objVertices[0]) * 0.25);
  outColor = vec4(wavecolor, 1); //wavecolor
  /*
  float bright = map(interference(num, gitter));
  vec3 wavecolor = (u_color.xyz/255.0) * (bright);
  outColor = vec4((thresh <= 0.0 ? wavecolor : (u_color.xyz/255.0) * float(bright > thresh)), 1);
  */
}