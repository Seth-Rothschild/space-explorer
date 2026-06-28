var CANVAS_W;
var CANVAS_H;
var EARTH_PERIOD = 60;

// All orbit_a values are visual world-pixels, not to scale.
// eccentricity and orbit_tilt give each planet a distinct elliptical path.
// moon period values are in seconds (scaled for visibility, not realistic).
var PLANET_DATA = [
    { name: "SUN",     type: "star",  radius: 80, color: "#FFD700" },

    { name: "MERCURY", radius: 8,  color: "#A8A8A8", glow: "#D0D0D0",
      orbit_a: 180,  eccentricity: 0.28, orbit_tilt: 0.40, period_years: 0.241,  init_angle: 0.0 },

    { name: "VENUS",   radius: 14, color: "#F5C518", glow: "#FFE050",
      orbit_a: 330,  eccentricity: 0.05, orbit_tilt: 1.00, period_years: 0.615,  init_angle: 2.5 },

    { name: "EARTH",   radius: 16, color: "#1E6FBF", glow: "#5090E0", hasLand: true,
      orbit_a: 460,  eccentricity: 0.06, orbit_tilt: 0.00, period_years: 1.0,    init_angle: 4.8,
      moon_data: [
          { name: "MOON",    radius: 5, color: "#D0D0D0", orbit_radius: 55, period: 15, init_angle: 1.0 },
      ] },

    { name: "MARS",    radius: 11, color: "#C1440E", glow: "#E05A20",
      orbit_a: 620,  eccentricity: 0.18, orbit_tilt: 0.60, period_years: 1.881,  init_angle: 1.2,
      moon_data: [
          { name: "PHOBOS",  radius: 3, color: "#907060", orbit_radius: 28, period: 4,  init_angle: 0.5 },
          { name: "DEIMOS",  radius: 3, color: "#B09080", orbit_radius: 42, period: 8,  init_angle: 3.0 },
      ] },

    { name: "VESTA",   radius: 5,  color: "#9898A0", glow: "#B8B8C0", type: "asteroid",
      orbit_a: 730,  eccentricity: 0.09, orbit_tilt: 0.95, period_years: 3.63,   init_angle: 3.0 },

    { name: "CERES",   radius: 5,  color: "#A08878", glow: "#C0A898", type: "dwarf",
      orbit_a: 780,  eccentricity: 0.08, orbit_tilt: 1.40, period_years: 4.6,    init_angle: 2.0 },

    { name: "JUPITER", radius: 45, color: "#C88B3A", glow: "#E8A050", hasBands: true,
      orbit_a: 1100, eccentricity: 0.12, orbit_tilt: 0.20, period_years: 11.86,  init_angle: 5.5,
      moon_data: [
          { name: "IO",       radius: 5, color: "#FFA000", orbit_radius: 70,  period: 5,  init_angle: 0.0 },
          { name: "EUROPA",   radius: 4, color: "#D0C8B0", orbit_radius: 88,  period: 10, init_angle: 2.1 },
          { name: "GANYMEDE", radius: 6, color: "#A09070", orbit_radius: 110, period: 20, init_angle: 4.0 },
          { name: "CALLISTO", radius: 5, color: "#706050", orbit_radius: 140, period: 40, init_angle: 1.0 },
      ] },

    { name: "SATURN",  radius: 35, color: "#E8C870", glow: "#FFE090", hasRings: true,
      orbit_a: 1650, eccentricity: 0.12, orbit_tilt: 0.90, period_years: 29.46,  init_angle: 2.8,
      moon_data: [
          { name: "MIMAS",     radius: 4, color: "#C0B8B0", orbit_radius: 78,  period: 8,  init_angle: 2.0 },
          { name: "ENCELADUS", radius: 4, color: "#EEF4EE", orbit_radius: 90,  period: 12, init_angle: 4.5 },
          { name: "TETHYS",    radius: 5, color: "#F0ECE8", orbit_radius: 100, period: 17, init_angle: 1.2 },
          { name: "DIONE",     radius: 5, color: "#D8D0C8", orbit_radius: 111, period: 22, init_angle: 5.0 },
          { name: "TITAN",     radius: 6, color: "#E0A830", orbit_radius: 125, period: 30, init_angle: 3.0 },
          { name: "RHEA",      radius: 5, color: "#C8C0B8", orbit_radius: 148, period: 46, init_angle: 0.8 },
          { name: "IAPETUS",   radius: 5, color: "#908070", orbit_radius: 195, period: 82, init_angle: 3.5 },
      ] },

    { name: "URANUS",  radius: 22, color: "#7FDBCA", glow: "#AFFFEF",
      orbit_a: 2250, eccentricity: 0.08, orbit_tilt: 0.50, period_years: 84.01,  init_angle: 0.9,
      moon_data: [
          { name: "MIRANDA", radius: 4, color: "#B0A0C0", orbit_radius: 42, period: 10, init_angle: 1.5 },
          { name: "ARIEL",   radius: 5, color: "#D8D0D0", orbit_radius: 53, period: 16, init_angle: 4.2 },
          { name: "UMBRIEL", radius: 4, color: "#686060", orbit_radius: 62, period: 22, init_angle: 0.9 },
          { name: "TITANIA", radius: 5, color: "#C0B0D0", orbit_radius: 74, period: 30, init_angle: 3.8 },
          { name: "OBERON",  radius: 5, color: "#908090", orbit_radius: 88, period: 40, init_angle: 0.4 },
      ] },

    { name: "NEPTUNE", radius: 20, color: "#3B5BDB", glow: "#6080FF",
      orbit_a: 2800, eccentricity: 0.08, orbit_tilt: 1.20, period_years: 164.8,  init_angle: 3.7,
      moon_data: [
          { name: "TRITON", radius: 5, color: "#D0C8E0", orbit_radius: 60, period: 18, init_angle: 0.8 },
      ] },

    { name: "PLUTO",    radius: 6,  color: "#C8A080", glow: "#E0B890", type: "dwarf",
      orbit_a: 3300, eccentricity: 0.38, orbit_tilt: 2.00, period_years: 248.0,  init_angle: 0.15,
      moon_data: [
          { name: "CHARON", radius: 4, color: "#9090A0", orbit_radius: 20, period: 8, init_angle: 2.0 },
      ] },

    { name: "HAUMEA",   radius: 5,  color: "#E0D8C0", glow: "#F0E8D0", type: "dwarf",
      orbit_a: 3600, eccentricity: 0.19, orbit_tilt: 0.70, period_years: 285.4,  init_angle: 1.0 },

    { name: "MAKEMAKE", radius: 5,  color: "#D4B898", glow: "#E8CCA8", type: "dwarf",
      orbit_a: 3800, eccentricity: 0.16, orbit_tilt: 1.50, period_years: 305.3,  init_angle: 3.5 },

    { name: "ERIS",     radius: 6,  color: "#E8E0D0", glow: "#F8F0E0", type: "dwarf",
      orbit_a: 4200, eccentricity: 0.44, orbit_tilt: 2.10, period_years: 558.8,  init_angle: 5.0 },

    { name: "ORCUS",    radius: 5,  color: "#B0A8C0", glow: "#C8C0D8", type: "probable",
      orbit_a: 3340, eccentricity: 0.23, orbit_tilt: 2.80, period_years: 246.1,  init_angle: 4.5 },

    { name: "QUAOAR",   radius: 5,  color: "#C07858", glow: "#D89870", type: "probable",
      orbit_a: 3650, eccentricity: 0.04, orbit_tilt: 0.30, period_years: 288.8,  init_angle: 1.2 },

    { name: "ARROKOTH", radius: 4,  color: "#C09878", glow: "#D8B090", type: "asteroid",
      orbit_a: 3760, eccentricity: 0.04, orbit_tilt: 2.70, period_years: 297.8,  init_angle: 0.7 },

    { name: "GONGGONG", radius: 5,  color: "#C85040", glow: "#E07050", type: "probable",
      orbit_a: 4100, eccentricity: 0.50, orbit_tilt: 1.50, period_years: 547.0,  init_angle: 3.2 },

    { name: "SEDNA",    radius: 5,  color: "#D03828", glow: "#E85840", type: "probable",
      orbit_a: 4600, eccentricity: 0.84, orbit_tilt: 0.70, period_years: 11400,  init_angle: 5.5 },

    { name: "FAROUT",   radius: 4,  color: "#E0B8A8", glow: "#F0C8B8", type: "asteroid",
      orbit_a: 5000, eccentricity: 0.53, orbit_tilt: 1.80, period_years: 737.0,  init_angle: 1.5 },

    { name: "FARFAROUT",radius: 4,  color: "#C8C0B8", glow: "#E0D8D0", type: "asteroid",
      orbit_a: 5400, eccentricity: 0.65, orbit_tilt: 0.50, period_years: 700.0,  init_angle: 3.8 },
];

var STARS = [];

function init_stars() {
    STARS = [];
    for (var i = 0; i < 350; i++) {
        STARS.push({
            x: Math.random() * CANVAS_W,
            y: Math.random() * CANVAS_H,
            size: Math.random() * 1.8 + 0.3,
            phase: Math.random() * Math.PI * 2,
            speed: 0.02 + Math.random() * 0.04,
        });
    }
}

function draw_stars(ctx, tick) {
    for (var i = 0; i < STARS.length; i++) {
        var s = STARS[i];
        var brightness = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(tick * s.speed + s.phase));
        ctx.globalAlpha = brightness;
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

// cam_wx/cam_wy: world coordinates the camera is centered on
function draw_orbit_paths(ctx, planets, cam_wx, cam_wy) {
    var sun_sx = -cam_wx + CANVAS_W / 2;
    var sun_sy = -cam_wy + CANVAS_H / 2;
    ctx.lineWidth = 1.5;
    for (var i = 0; i < planets.length; i++) {
        var p = planets[i];
        if (!p.orbit_a) continue;
        var b = p.orbit_a * Math.sqrt(1 - p.eccentricity * p.eccentricity);
        ctx.strokeStyle = (p.type === "dwarf" || p.type === "probable")
            ? "rgba(180, 140, 90, 0.45)"
            : "rgba(100, 135, 230, 0.5)";
        ctx.beginPath();
        ctx.ellipse(sun_sx, sun_sy, p.orbit_a, b, p.orbit_tilt, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function draw_moon_orbit_paths(ctx, planets, cam_wx, cam_wy) {
    ctx.lineWidth = 1;
    for (var i = 0; i < planets.length; i++) {
        var p = planets[i];
        if (!p.moons || p.moons.length === 0) continue;
        var dist_to_cam = Math.sqrt((p.wx - cam_wx) * (p.wx - cam_wx) + (p.wy - cam_wy) * (p.wy - cam_wy));
        if (dist_to_cam > 500) continue;
        var planet_sx = p.wx - cam_wx + CANVAS_W / 2;
        var planet_sy = p.wy - cam_wy + CANVAS_H / 2;
        ctx.strokeStyle = "rgba(100, 130, 180, 0.38)";
        for (var j = 0; j < p.moons.length; j++) {
            ctx.beginPath();
            ctx.arc(planet_sx, planet_sy, p.moons[j].orbit_radius, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

function draw_sun(ctx, p, tick) {
    var pulse = 1 + 0.05 * Math.sin(tick * 0.04);
    var glow_r = p.radius * 2.3 * pulse;
    var outer_glow = ctx.createRadialGradient(p.x, p.y, p.radius * 0.6, p.x, p.y, glow_r);
    outer_glow.addColorStop(0, "rgba(255, 200, 0, 0.55)");
    outer_glow.addColorStop(0.4, "rgba(255, 120, 0, 0.25)");
    outer_glow.addColorStop(1, "rgba(255, 60, 0, 0)");
    ctx.fillStyle = outer_glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, glow_r, 0, Math.PI * 2);
    ctx.fill();

    for (var i = 0; i < 16; i++) {
        var ray_angle = (i / 16) * Math.PI * 2 + tick * 0.004;
        var ray_len = p.radius * (0.22 + 0.14 * Math.sin(tick * 0.06 + i * 1.3));
        ctx.strokeStyle = "rgba(255, 210, 50, 0.55)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(p.x + Math.cos(ray_angle) * p.radius, p.y + Math.sin(ray_angle) * p.radius);
        ctx.lineTo(p.x + Math.cos(ray_angle) * (p.radius + ray_len), p.y + Math.sin(ray_angle) * (p.radius + ray_len));
        ctx.stroke();
    }

    var body_grad = ctx.createRadialGradient(p.x - p.radius * 0.3, p.y - p.radius * 0.3, 0, p.x, p.y, p.radius);
    body_grad.addColorStop(0, "#FFFFC0");
    body_grad.addColorStop(0.35, "#FFD700");
    body_grad.addColorStop(0.75, "#FF8C00");
    body_grad.addColorStop(1, "#FF5500");
    ctx.fillStyle = body_grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(200, 90, 0, 0.35)";
    ctx.beginPath();
    ctx.arc(p.x - 18, p.y + 25, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x + 25, p.y - 10, 7, 0, Math.PI * 2);
    ctx.fill();
}

function draw_planet_glow(ctx, p, intensity) {
    if (intensity <= 0) return;
    var grad = ctx.createRadialGradient(p.x, p.y, p.radius, p.x, p.y, p.radius * 2.4);
    grad.addColorStop(0, "rgba(255,255,255," + (intensity * 0.55) + ")");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * 2.4, 0, Math.PI * 2);
    ctx.fill();
}

function draw_ring_half(ctx, p, half) {
    var rx = p.radius * 1.85;
    var ry = p.radius * 0.34;
    var start = half === "back" ? Math.PI : 0;
    var end   = half === "back" ? 0 : Math.PI;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, rx, ry, 0, start, end);
    ctx.strokeStyle = "#C8A030";
    ctx.lineWidth = 10;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, rx, ry, 0, start, end);
    ctx.strokeStyle = "#F0D870";
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, rx * 0.86, ry * 0.86, 0, start, end);
    ctx.strokeStyle = "rgba(180, 140, 30, 0.55)";
    ctx.lineWidth = 4;
    ctx.stroke();
}

function draw_jupiter_bands(ctx, p) {
    var bands = [
        { y_frac: -0.75, h_frac: 0.22, color: "#9A5E1E" },
        { y_frac: -0.46, h_frac: 0.22, color: "#D89A50" },
        { y_frac: -0.15, h_frac: 0.27, color: "#8A5018" },
        { y_frac:  0.18, h_frac: 0.22, color: "#C07838" },
        { y_frac:  0.48, h_frac: 0.22, color: "#9A6028" },
    ];
    for (var i = 0; i < bands.length; i++) {
        var b = bands[i];
        ctx.fillStyle = b.color;
        ctx.fillRect(p.x - p.radius, p.y + b.y_frac * p.radius, p.radius * 2, b.h_frac * p.radius);
    }
    ctx.fillStyle = "rgba(255, 210, 150, 0.3)";
    ctx.beginPath();
    ctx.ellipse(p.x + p.radius * 0.28, p.y + p.radius * 0.18, p.radius * 0.18, p.radius * 0.12, 0.3, 0, Math.PI * 2);
    ctx.fill();
}

function draw_earth_details(ctx, p) {
    var r = p.radius;
    ctx.fillStyle = "#2DB050";
    ctx.beginPath();
    ctx.ellipse(p.x - r * 0.38, p.y - r * 0.12, r * 0.44, r * 0.56, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(p.x + r * 0.44, p.y + r * 0.25, r * 0.38, r * 0.44, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(p.x + r * 0.12, p.y - r * 0.56, r * 0.25, r * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.ellipse(p.x - r * 0.5, p.y - r * 0.62, r * 0.31, r * 0.19, 0.5, 0, Math.PI * 2);
    ctx.fill();
}

function draw_planet_shine(ctx, p) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.clip();
    var shine = ctx.createRadialGradient(
        p.x - p.radius * 0.38, p.y - p.radius * 0.38, 0,
        p.x - p.radius * 0.2,  p.y - p.radius * 0.2,  p.radius * 0.85
    );
    shine.addColorStop(0, "rgba(255,255,255,0.28)");
    shine.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = shine;
    ctx.fillRect(p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2);
    ctx.restore();
}

function draw_planet(ctx, p, near_intensity, tick) {
    if (p.type === "star") { draw_sun(ctx, p, tick); return; }

    draw_planet_glow(ctx, p, near_intensity);

    if (p.hasRings) draw_ring_half(ctx, p, "back");

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();

    if (p.hasLand || p.hasBands) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.clip();
        if (p.hasBands) draw_jupiter_bands(ctx, p);
        if (p.hasLand)  draw_earth_details(ctx, p);
        ctx.restore();
    }

    draw_planet_shine(ctx, p);
    if (p.hasRings) draw_ring_half(ctx, p, "front");
}

function draw_planet_name(ctx, p, near_intensity) {
    var base_size = Math.max(11, Math.round(p.radius * 0.5));
    var size = Math.round(base_size + near_intensity * 16);
    var label_y = p.y + p.radius + 20;
    ctx.textAlign = "center";
    ctx.font = "bold " + size + "px Arial";
    ctx.shadowColor = "rgba(0,0,20,0.9)";
    ctx.shadowBlur = 4;
    if (near_intensity > 0.05) { ctx.shadowColor = "#FFFFFF"; ctx.shadowBlur = 12; }
    ctx.fillStyle = "rgba(255,255,255," + (0.55 + near_intensity * 0.45) + ")";
    ctx.fillText(p.name, p.x, label_y);
    if ((p.type === "dwarf" || p.type === "probable") && near_intensity > 0.3) {
        ctx.font = "10px Arial";
        ctx.fillStyle = "rgba(200,170,130,0.8)";
        ctx.shadowBlur = 0;
        var type_label = p.type === "probable" ? "probable dwarf planet" : "dwarf planet";
        ctx.fillText(type_label, p.x, label_y + 14);
    }
    ctx.shadowBlur = 0;
}

function draw_moon(ctx, moon) {
    ctx.fillStyle = moon.color;
    ctx.beginPath();
    ctx.arc(moon.x, moon.y, moon.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.arc(moon.x - moon.radius * 0.3, moon.y - moon.radius * 0.3, moon.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
}

function draw_moon_name(ctx, moon) {
    ctx.textAlign = "center";
    ctx.font = "bold 9px Arial";
    ctx.shadowColor = "rgba(0,0,20,0.9)";
    ctx.shadowBlur = 3;
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText(moon.name, moon.x, moon.y + moon.radius + 11);
    ctx.shadowBlur = 0;
}

function draw_spaceship(ctx, ship) {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);

    if (ship.moving) {
        var flame_len = 10 + Math.random() * 10;
        var flame_grad = ctx.createLinearGradient(-8, 0, -8 - flame_len, 0);
        flame_grad.addColorStop(0, "rgba(255,210,50,1)");
        flame_grad.addColorStop(0.5, "rgba(255,100,0,0.8)");
        flame_grad.addColorStop(1, "rgba(255,50,0,0)");
        ctx.fillStyle = flame_grad;
        ctx.beginPath();
        ctx.moveTo(-7, -4);
        ctx.lineTo(-7 - flame_len, 0);
        ctx.lineTo(-7, 4);
        ctx.closePath();
        ctx.fill();
    }

    ctx.fillStyle = "#7088CC";
    ctx.strokeStyle = "#506090";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-7, -5); ctx.lineTo(-15, -13); ctx.lineTo(-9, -5);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-7, 5); ctx.lineTo(-15, 13); ctx.lineTo(-9, 5);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    ctx.fillStyle = "#C8D4F0"; ctx.strokeStyle = "#8090C0";
    ctx.beginPath();
    ctx.moveTo(7, -5); ctx.lineTo(18, 0); ctx.lineTo(7, 5);
    ctx.lineTo(-7, 5); ctx.lineTo(-7, -5);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    ctx.fillStyle = "#66CCFF"; ctx.strokeStyle = "#44AADD"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(4, 0, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.beginPath(); ctx.arc(3, -1.5, 1.5, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
}
