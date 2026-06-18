var canvas = document.getElementById("game");
var ctx = canvas.getContext("2d");

var cam_wx = 0;
var cam_wy = -460;

var ship = {
    wx: 0,
    wy: -460,
    angle: 0,
    moving: false,
    state: "free",
    travel_target: null,
    travel_orbit_radius: 0,
    travel_current_speed: 0,
    travel_decel_dist: 300,
    travel_locked_angle: 0,
    orbit_target: null,
    orbit_angle: 0,
    orbit_radius: 60,
};

var SHIP_SPEED = 6;
var SHIP_TRAVEL_SPEED = 20;
var SHIP_ORBIT_SPEED = 0.012;

var keys = {};
document.addEventListener("keydown", function (e) {
    keys[e.key] = true;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.key) >= 0) {
        e.preventDefault();
    }
});
document.addEventListener("keyup", function (e) { keys[e.key] = false; });

var planets = [];

function init_planets() {
    for (var i = 0; i < PLANET_DATA.length; i++) {
        var data = PLANET_DATA[i];
        var orb_a = data.orbit_a || 0;
        var orb_e = data.eccentricity || 0;
        var orb_b = orb_a > 0 ? orb_a * Math.sqrt(1 - orb_e * orb_e) : 0;
        var tilt = data.orbit_tilt || 0;
        var angle = data.init_angle || 0;

        var ax = orb_a * Math.cos(angle);
        var ay = orb_b * Math.sin(angle);
        var wx = ax * Math.cos(tilt) - ay * Math.sin(tilt);
        var wy = ax * Math.sin(tilt) + ay * Math.cos(tilt);

        var planet = {
            name: data.name,
            wx: wx,
            wy: wy,
            x: 0,
            y: 0,
            radius: data.radius,
            color: data.color,
            glow: data.glow,
            type: data.type,
            hasLand: data.hasLand,
            hasBands: data.hasBands,
            hasRings: data.hasRings,
            orbit_a: orb_a,
            orbit_b: orb_b,
            orbit_tilt: tilt,
            orbit_period: data.period_years ? data.period_years * EARTH_PERIOD : null,
            orbit_angle: angle,
            eccentricity: orb_e,
            visited: false,
            moons: [],
        };

        if (data.moon_data) {
            for (var j = 0; j < data.moon_data.length; j++) {
                var md = data.moon_data[j];
                var m_angle = md.init_angle || 0;
                var moon = {
                    name: md.name,
                    wx: wx + Math.cos(m_angle) * md.orbit_radius,
                    wy: wy + Math.sin(m_angle) * md.orbit_radius,
                    x: 0,
                    y: 0,
                    radius: md.radius,
                    color: md.color,
                    orbit_radius: md.orbit_radius,
                    orbit_period: md.period,
                    orbit_angle: m_angle,
                    type: "moon",
                    visited: false,
                    parent: planet,
                    moons: [],
                };
                planet.moons.push(moon);
            }
        }

        planets.push(planet);
    }
}

init_planets();

var visited_count = 0;
var particles = [];
var tick = 0;

var current_fact_name = null;
var current_fact_index = 0;

function update_orbits() {
    for (var i = 0; i < planets.length; i++) {
        var p = planets[i];
        if (!p.orbit_a) continue;

        var ang_vel = (2 * Math.PI) / (p.orbit_period * 60);
        p.orbit_angle -= ang_vel;

        var ax = p.orbit_a * Math.cos(p.orbit_angle);
        var ay = p.orbit_b * Math.sin(p.orbit_angle);
        p.wx = ax * Math.cos(p.orbit_tilt) - ay * Math.sin(p.orbit_tilt);
        p.wy = ax * Math.sin(p.orbit_tilt) + ay * Math.cos(p.orbit_tilt);

        for (var j = 0; j < p.moons.length; j++) {
            var m = p.moons[j];
            var m_vel = (2 * Math.PI) / (m.orbit_period * 60);
            m.orbit_angle -= m_vel;
            m.wx = p.wx + Math.cos(m.orbit_angle) * m.orbit_radius;
            m.wy = p.wy + Math.sin(m.orbit_angle) * m.orbit_radius;
        }
    }
}

function update_camera() {
    var target_wx = ship.wx;
    var target_wy = ship.wy;
    if (ship.state === "orbiting" && ship.orbit_target) {
        target_wx = ship.orbit_target.wx;
        target_wy = ship.orbit_target.wy;
    }
    cam_wx += (target_wx - cam_wx) * 0.12;
    cam_wy += (target_wy - cam_wy) * 0.12;
}

function any_move_key() {
    return keys["ArrowLeft"] || keys["ArrowRight"] || keys["ArrowUp"] || keys["ArrowDown"] ||
           keys["a"] || keys["d"] || keys["w"] || keys["s"] ||
           keys["A"] || keys["D"] || keys["W"] || keys["S"];
}

function update_ship() {
    if (ship.state === "free") {
        update_ship_free();
    } else if (ship.state === "traveling") {
        update_ship_traveling();
    } else if (ship.state === "orbiting") {
        update_ship_orbiting();
    }
}

function update_ship_free() {
    var dx = 0;
    var dy = 0;
    if (keys["ArrowLeft"]  || keys["a"] || keys["A"]) dx -= 1;
    if (keys["ArrowRight"] || keys["d"] || keys["D"]) dx += 1;
    if (keys["ArrowUp"]    || keys["w"] || keys["W"]) dy -= 1;
    if (keys["ArrowDown"]  || keys["s"] || keys["S"]) dy += 1;

    ship.moving = (dx !== 0 || dy !== 0);
    if (ship.moving) {
        var target_angle = Math.atan2(dy, dx);
        var diff = target_angle - ship.angle;
        while (diff > Math.PI)  diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        ship.angle += diff * 0.15;
        ship.wx += dx * SHIP_SPEED;
        ship.wy += dy * SHIP_SPEED;
    }

    for (var i = 0; i < planets.length; i++) {
        var p = planets[i];
        var pdx = ship.wx - p.wx;
        var pdy = ship.wy - p.wy;
        var pdist = Math.sqrt(pdx * pdx + pdy * pdy);
        var p_min = p.radius + 15;
        if (pdist < p_min && pdist > 0) {
            var push = Math.atan2(pdy, pdx);
            ship.wx = p.wx + Math.cos(push) * p_min;
            ship.wy = p.wy + Math.sin(push) * p_min;
        }
        for (var j = 0; j < p.moons.length; j++) {
            var m = p.moons[j];
            var mdx = ship.wx - m.wx;
            var mdy = ship.wy - m.wy;
            var mdist = Math.sqrt(mdx * mdx + mdy * mdy);
            var m_min = m.radius + 10;
            if (mdist < m_min && mdist > 0) {
                var mpush = Math.atan2(mdy, mdx);
                ship.wx = m.wx + Math.cos(mpush) * m_min;
                ship.wy = m.wy + Math.sin(mpush) * m_min;
            }
        }
    }
}

function update_ship_traveling() {
    if (any_move_key()) {
        ship.state = "free";
        ship.travel_target = null;
        ship.travel_current_speed = 0;
        ship.moving = false;
        exit_orbit_display();
        return;
    }

    var target = ship.travel_target;
    var dx = ship.wx - target.wx;
    var dy = ship.wy - target.wy;
    var dist_from_target = Math.sqrt(dx * dx + dy * dy);
    var orbit_r = ship.travel_orbit_radius;

    // Lock the orbit-entry angle once we're close so the target point stops jittering
    if (dist_from_target > orbit_r * 2) {
        ship.travel_locked_angle = Math.atan2(dy, dx);
    }

    var dest_wx = target.wx + Math.cos(ship.travel_locked_angle) * orbit_r;
    var dest_wy = target.wy + Math.sin(ship.travel_locked_angle) * orbit_r;
    var ddx = dest_wx - ship.wx;
    var ddy = dest_wy - ship.wy;
    var dist_to_dest = Math.sqrt(ddx * ddx + ddy * ddy);

    if (dist_to_dest < 6 || dist_from_target <= orbit_r + 3) {
        // Enter orbit at the ship's actual current angle — no teleport snap
        var entry_angle = Math.atan2(ship.wy - target.wy, ship.wx - target.wx);
        ship.travel_current_speed = 0;
        ship.state = "orbiting";
        ship.orbit_target = target;
        ship.orbit_angle = entry_angle;
        ship.orbit_radius = orbit_r;
        ship.wx = target.wx + Math.cos(entry_angle) * orbit_r;
        ship.wy = target.wy + Math.sin(entry_angle) * orbit_r;
        enter_orbit(target);
    } else {
        ship.moving = true;
        var decel_fraction = Math.min(1, dist_to_dest / ship.travel_decel_dist);
        var desired_speed = Math.max(1, decel_fraction * SHIP_TRAVEL_SPEED);
        ship.travel_current_speed += (desired_speed - ship.travel_current_speed) * 0.04;
        ship.angle = Math.atan2(ddy, ddx);
        ship.wx += (ddx / dist_to_dest) * ship.travel_current_speed;
        ship.wy += (ddy / dist_to_dest) * ship.travel_current_speed;
    }
}

function update_ship_orbiting() {
    if (any_move_key()) {
        ship.state = "free";
        ship.orbit_target = null;
        exit_orbit_display();
        return;
    }

    var target = ship.orbit_target;
    ship.orbit_angle -= SHIP_ORBIT_SPEED;
    ship.wx = target.wx + Math.cos(ship.orbit_angle) * ship.orbit_radius;
    ship.wy = target.wy + Math.sin(ship.orbit_angle) * ship.orbit_radius;
    ship.angle = ship.orbit_angle - Math.PI / 2;
    ship.moving = true;
}

function travel_to(target) {
    var orbit_r = target.type === "moon" ? target.radius + 22 : target.radius + 60;
    var init_dx = ship.wx - target.wx;
    var init_dy = ship.wy - target.wy;
    var init_dist = Math.sqrt(init_dx * init_dx + init_dy * init_dy) - orbit_r;
    ship.state = "traveling";
    ship.travel_target = target;
    ship.travel_orbit_radius = orbit_r;
    ship.travel_current_speed = 0;
    ship.travel_decel_dist = Math.max(200, Math.min(600, init_dist * 0.30));
    ship.travel_locked_angle = Math.atan2(init_dy, init_dx);
    ship.moving = true;
    exit_orbit_display();
    ship.orbit_target = null;
}

function enter_orbit(target) {
    if (!target.visited) {
        target.visited = true;
        visited_count++;
        document.getElementById("visited-count").textContent = visited_count;
        spawn_celebration(target);
        update_nav_visited();
    }
    show_fact_panel(target.name, target.color);
    highlight_nav_button(target.name);
}

function exit_orbit_display() {
    hide_fact_panel();
    clear_nav_highlight();
}

function spawn_celebration(p) {
    var colors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#A8E6CF", "#FF8ED4", "#FFD93D", "#C3F0CA"];
    for (var i = 0; i < 28; i++) {
        var angle = Math.random() * Math.PI * 2;
        var speed = 1.5 + Math.random() * 3;
        particles.push({
            x: p.x,
            y: p.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            decay: 0.014 + Math.random() * 0.008,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 3 + Math.random() * 4,
            is_trail: false,
        });
    }
}

function spawn_trail() {
    if (!ship.moving) return;
    var ship_sx = ship.wx - cam_wx + CANVAS_W / 2;
    var ship_sy = ship.wy - cam_wy + CANVAS_H / 2;
    var back_x = ship_sx - Math.cos(ship.angle) * 9;
    var back_y = ship_sy - Math.sin(ship.angle) * 9;
    var is_warp = ship.state === "traveling";
    particles.push({
        x: back_x + (Math.random() - 0.5) * 3,
        y: back_y + (Math.random() - 0.5) * 3,
        vx: -Math.cos(ship.angle) * (is_warp ? 2.0 : 0.6) + (Math.random() - 0.5) * 0.5,
        vy: -Math.sin(ship.angle) * (is_warp ? 2.0 : 0.6) + (Math.random() - 0.5) * 0.5,
        life: 1.0,
        decay: is_warp ? 0.055 : 0.09,
        color: is_warp ? "#80CCFF" : "#FF9900",
        size: is_warp ? 3.5 : 2.5,
        is_trail: true,
    });
}

function update_particles() {
    var next = [];
    for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life > 0) next.push(p);
    }
    particles = next;
}

function draw_particles_list(ctx) {
    for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        var draw_size = p.is_trail ? p.size * p.life : p.size;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, draw_size), 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function check_visits_proximity() {
    if (ship.state !== "free") return;
    for (var i = 0; i < planets.length; i++) {
        var p = planets[i];
        if (!p.visited) {
            var dx = ship.wx - p.wx;
            var dy = ship.wy - p.wy;
            if (Math.sqrt(dx * dx + dy * dy) < p.radius + 60) {
                p.visited = true;
                visited_count++;
                document.getElementById("visited-count").textContent = visited_count;
                spawn_celebration(p);
                update_nav_visited();
            }
        }
        for (var j = 0; j < p.moons.length; j++) {
            var m = p.moons[j];
            if (!m.visited) {
                var mdx = ship.wx - m.wx;
                var mdy = ship.wy - m.wy;
                if (Math.sqrt(mdx * mdx + mdy * mdy) < m.radius + 30) {
                    m.visited = true;
                    visited_count++;
                    document.getElementById("visited-count").textContent = visited_count;
                    spawn_celebration(m);
                    update_nav_visited();
                }
            }
        }
    }
}

function set_screen_coords() {
    for (var i = 0; i < planets.length; i++) {
        var p = planets[i];
        p.x = p.wx - cam_wx + CANVAS_W / 2;
        p.y = p.wy - cam_wy + CANVAS_H / 2;
        for (var j = 0; j < p.moons.length; j++) {
            var m = p.moons[j];
            m.x = m.wx - cam_wx + CANVAS_W / 2;
            m.y = m.wy - cam_wy + CANVAS_H / 2;
        }
    }
}

function is_on_screen(obj) {
    var margin = obj.radius + 150;
    return obj.x > -margin && obj.x < CANVAS_W + margin &&
           obj.y > -margin && obj.y < CANVAS_H + margin;
}

function get_near_intensity(p) {
    if (ship.state === "orbiting" && ship.orbit_target === p) return 1.0;
    var dx = ship.wx - p.wx;
    var dy = ship.wy - p.wy;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var touch = p.radius + 13;
    var far = p.radius + 110;
    if (dist <= touch) return 1;
    if (dist >= far)   return 0;
    return 1 - (dist - touch) / (far - touch);
}

function show_fact_panel(name, color) {
    current_fact_name = name;
    var facts = (typeof FUN_FACTS !== "undefined") ? FUN_FACTS[name] : null;
    current_fact_index = facts ? Math.floor(Math.random() * facts.length) : 0;
    var panel = document.getElementById("fact-panel");
    var name_el = document.getElementById("fact-name");
    var text_el = document.getElementById("fact-text");
    var link_el = document.getElementById("wiki-link");
    name_el.textContent = name;
    name_el.style.color = color || "#FFD700";
    name_el.style.textShadow = "0 0 12px " + (color || "#FFD700");
    var wiki_url = (typeof WIKI_URLS !== "undefined") ? WIKI_URLS[name] : null;
    if (wiki_url) {
        link_el.href = wiki_url;
        link_el.textContent = wiki_url;
        link_el.style.display = "block";
    } else {
        link_el.style.display = "none";
    }
    if (facts && facts.length > 0) {
        text_el.textContent = facts[current_fact_index];
        panel.style.visibility = "visible";
    }
}

function hide_fact_panel() {
    document.getElementById("fact-panel").style.visibility = "hidden";
    document.getElementById("wiki-link").style.display = "none";
    current_fact_name = null;
}

function advance_fact() {
    if (!current_fact_name) return;
    var facts = (typeof FUN_FACTS !== "undefined") ? FUN_FACTS[current_fact_name] : null;
    if (!facts || facts.length === 0) return;
    current_fact_index = (current_fact_index + 1) % facts.length;
    document.getElementById("fact-text").textContent = facts[current_fact_index];
}


function hex_to_rgba(hex, alpha) {
    if (!hex || hex.length < 7) return "rgba(128,128,128," + alpha + ")";
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
}

function lighten(hex) {
    if (!hex || hex.length < 7) return "#CCCCCC";
    var r = Math.min(255, parseInt(hex.slice(1, 3), 16) + 80);
    var g = Math.min(255, parseInt(hex.slice(3, 5), 16) + 80);
    var b = Math.min(255, parseInt(hex.slice(5, 7), 16) + 80);
    return "rgb(" + r + "," + g + "," + b + ")";
}

function build_nav_buttons() {
    var panel = document.getElementById("nav-panel");
    panel.innerHTML = "";

    for (var i = 0; i < planets.length; i++) {
        var p = planets[i];

        var btn = document.createElement("button");
        btn.className = "nav-btn planet-btn";
        btn.setAttribute("data-name", p.name);
        btn.style.background = hex_to_rgba(p.color, 0.18);
        btn.style.borderColor = p.color;
        btn.style.color = lighten(p.color);

        var p_check = document.createElement("span");
        p_check.className = "nav-check";
        p_check.textContent = "○";
        btn.appendChild(p_check);
        btn.appendChild(document.createTextNode(" " + p.name));

        (function (planet) {
            btn.addEventListener("click", function () { travel_to(planet); });
        })(p);

        panel.appendChild(btn);

        for (var j = 0; j < p.moons.length; j++) {
            var m = p.moons[j];

            var mbtn = document.createElement("button");
            mbtn.className = "nav-btn moon-btn";
            mbtn.setAttribute("data-name", m.name);
            mbtn.style.background = hex_to_rgba(m.color, 0.12);
            mbtn.style.borderColor = hex_to_rgba(m.color, 0.55);
            mbtn.style.color = "rgba(220,210,200,0.88)";

            var m_check = document.createElement("span");
            m_check.className = "nav-check";
            m_check.textContent = "○";
            mbtn.appendChild(m_check);
            mbtn.appendChild(document.createTextNode(" " + m.name));

            (function (moon) {
                mbtn.addEventListener("click", function () { travel_to(moon); });
            })(m);

            panel.appendChild(mbtn);
        }
    }
}

function highlight_nav_button(name) {
    var btns = document.querySelectorAll(".nav-btn");
    for (var i = 0; i < btns.length; i++) {
        btns[i].classList.remove("nav-active");
        if (btns[i].getAttribute("data-name") === name) {
            btns[i].classList.add("nav-active");
            btns[i].scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
    }
}

function clear_nav_highlight() {
    var btns = document.querySelectorAll(".nav-btn");
    for (var i = 0; i < btns.length; i++) {
        btns[i].classList.remove("nav-active");
    }
}

function update_nav_visited() {
    for (var i = 0; i < planets.length; i++) {
        mark_nav_check(planets[i].name, planets[i].visited);
        for (var j = 0; j < planets[i].moons.length; j++) {
            mark_nav_check(planets[i].moons[j].name, planets[i].moons[j].visited);
        }
    }
}

function mark_nav_check(name, visited) {
    var el = document.querySelector("[data-name='" + name + "'] .nav-check");
    if (!el) return;
    el.textContent = visited ? "✓" : "○";
    el.style.color = visited ? "#FFD700" : "";
    el.style.opacity = visited ? "1" : "";
}

function draw_orbit_label() {
    if (ship.state !== "orbiting" || !ship.orbit_target) return;
    var target = ship.orbit_target;
    ctx.textAlign = "center";
    ctx.font = "bold 18px Arial";
    ctx.fillStyle = target.color || "#FFFFFF";
    ctx.shadowColor = target.color || "#FFFFFF";
    ctx.shadowBlur = 14;
    ctx.fillText("ORBITING " + target.name, CANVAS_W / 2, 30);
    ctx.shadowBlur = 0;
}

function loop() {
    tick++;

    update_orbits();
    update_ship();
    update_camera();
    set_screen_coords();
    spawn_trail();
    check_visits_proximity();
    update_particles();

    ctx.fillStyle = "#04061A";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    draw_stars(ctx, tick);
    draw_orbit_paths(ctx, planets, cam_wx, cam_wy);
    draw_moon_orbit_paths(ctx, planets, cam_wx, cam_wy);

    draw_particles_list(ctx);

    for (var i = 0; i < planets.length; i++) {
        var p = planets[i];

        if (!is_on_screen(p)) {
            for (var j = 0; j < p.moons.length; j++) {
                if (is_on_screen(p.moons[j])) draw_moon(ctx, p.moons[j]);
            }
            continue;
        }

        var near = get_near_intensity(p);
        draw_planet(ctx, p, near, tick);
        draw_planet_name(ctx, p, near);

        for (var j = 0; j < p.moons.length; j++) {
            var m = p.moons[j];
            if (!is_on_screen(m)) continue;
            draw_moon(ctx, m);
            var mdist_w = Math.sqrt((ship.wx - m.wx) * (ship.wx - m.wx) + (ship.wy - m.wy) * (ship.wy - m.wy));
            if (near > 0.2 || mdist_w < m.radius + 100 || (ship.state === "orbiting" && ship.orbit_target === m)) {
                draw_moon_name(ctx, m);
            }
        }
    }

    var ship_sx = ship.wx - cam_wx + CANVAS_W / 2;
    var ship_sy = ship.wy - cam_wy + CANVAS_H / 2;
    draw_spaceship(ctx, { x: ship_sx, y: ship_sy, angle: ship.angle, moving: ship.moving });

    draw_orbit_label();

    requestAnimationFrame(loop);
}

function resize_canvas() {
    var w = canvas.parentElement.clientWidth;
    var h = w < 700
        ? Math.round(window.innerHeight * 0.5)
        : Math.max(400, window.innerHeight - 260);
    canvas.width = w;
    canvas.height = h;
    CANVAS_W = w;
    CANVAS_H = h;
    init_stars();
}

build_nav_buttons();
window.addEventListener("resize", resize_canvas);
document.getElementById("fact-next").addEventListener("click", function () {
    advance_fact();
    fact_cycle_timer = 0;
});

requestAnimationFrame(function () {
    resize_canvas();
    loop();
});
