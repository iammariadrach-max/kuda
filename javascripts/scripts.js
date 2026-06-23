// подвал
;(() => {
  const field = document.querySelector('.footer-cloud-field')
  const cloudElements = document.querySelectorAll('.footer-cloud')

  if (!field || !cloudElements.length) return

  function vec2(x = 0, y = 0) {
    return { x, y }
  }

  function getFieldSize() {
    return {
      width: field.clientWidth,
      height: field.clientHeight
    }
  }

  const clouds = []

  cloudElements.forEach((el, index) => {
    const size = getFieldSize()

    const width = el.offsetWidth || size.width * 0.14
    const height = el.offsetHeight || width * 0.55

    const startX = (size.width / cloudElements.length) * index
    const randomX = startX + Math.random() * 40
    const randomY = size.height * 0.45 + Math.random() * size.height * 0.25

    clouds.push({
      el,
      width,
      height,
      radius: width * 0.38,
      pos: vec2(
        Math.min(randomX, size.width - width),
        Math.min(randomY, size.height - height)
      ),
      vel: vec2((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2),
      acc: vec2()
    })
  })

  let mouse = vec2(-9999, -9999)
  let isInside = false
  let isPressed = false

  field.addEventListener('mousemove', (event) => {
    const rect = field.getBoundingClientRect()

    mouse.x = event.clientX - rect.left
    mouse.y = event.clientY - rect.top
    isInside = true
  })

  field.addEventListener('mouseenter', () => {
    isInside = true
  })

  field.addEventListener('mouseleave', () => {
    isInside = false
    isPressed = false
    mouse.x = -9999
    mouse.y = -9999
  })

  field.addEventListener('mousedown', () => {
    isPressed = true
  })

  window.addEventListener('mouseup', () => {
    isPressed = false
  })

  field.addEventListener(
    'touchmove',
    (event) => {
      const touch = event.touches[0]
      const rect = field.getBoundingClientRect()

      mouse.x = touch.clientX - rect.left
      mouse.y = touch.clientY - rect.top
      isInside = true
      isPressed = true
    },
    { passive: true }
  )

  field.addEventListener('touchend', () => {
    isInside = false
    isPressed = false
    mouse.x = -9999
    mouse.y = -9999
  })

  function cloudCenterX(cloud) {
    return cloud.pos.x + cloud.width * 0.5
  }

  function cloudCenterY(cloud) {
    return cloud.pos.y + cloud.height * 0.5
  }

  function applyForce(cloud, force) {
    cloud.acc.x += force.x
    cloud.acc.y += force.y
  }

  function collideClouds(a, b) {
    const dx = cloudCenterX(b) - cloudCenterX(a)
    const dy = cloudCenterY(b) - cloudCenterY(a)
    const distance = Math.sqrt(dx * dx + dy * dy)
    const minDistance = a.radius + b.radius

    if (distance < minDistance && distance > 0.01) {
      const nx = dx / distance
      const ny = dy / distance
      const overlap = (minDistance - distance) * 0.5

      a.pos.x -= nx * overlap
      a.pos.y -= ny * overlap
      b.pos.x += nx * overlap
      b.pos.y += ny * overlap

      const dvx = a.vel.x - b.vel.x
      const dvy = a.vel.y - b.vel.y
      const dot = dvx * nx + dvy * ny

      if (dot > 0) {
        const impulse = dot * 0.45

        a.vel.x -= impulse * nx
        a.vel.y -= impulse * ny
        b.vel.x += impulse * nx
        b.vel.y += impulse * ny
      }
    }
  }

  function updateCloud(cloud, dt) {
    const size = getFieldSize()

    const gravity = 0.025
    const friction = 0.985
    const bounce = 0.42

    cloud.width = cloud.el.offsetWidth || cloud.width
    cloud.height = cloud.el.offsetHeight || cloud.height
    cloud.radius = cloud.width * 0.38

    cloud.vel.x = (cloud.vel.x + cloud.acc.x) * friction
    cloud.vel.y = (cloud.vel.y + cloud.acc.y + gravity) * friction

    cloud.pos.x += cloud.vel.x * dt
    cloud.pos.y += cloud.vel.y * dt

    cloud.acc.x = 0
    cloud.acc.y = 0

    if (cloud.pos.x < 0) {
      cloud.pos.x = 0
      cloud.vel.x = Math.abs(cloud.vel.x) * bounce
    }

    if (cloud.pos.y < 0) {
      cloud.pos.y = 0
      cloud.vel.y = Math.abs(cloud.vel.y) * bounce
    }

    if (cloud.pos.x + cloud.width > size.width) {
      cloud.pos.x = size.width - cloud.width
      cloud.vel.x = -Math.abs(cloud.vel.x) * bounce
    }

    if (cloud.pos.y + cloud.height > size.height) {
      cloud.pos.y = size.height - cloud.height
      cloud.vel.y = -Math.abs(cloud.vel.y) * bounce
      cloud.vel.x *= 0.9
    }
  }

  function renderCloud(cloud) {
    cloud.el.style.transform = `
      translate3d(${cloud.pos.x.toFixed(2)}px, ${cloud.pos.y.toFixed(2)}px, 0)
    `
  }

  let lastTime = null

  function loop(time) {
    if (!lastTime) lastTime = time

    const rawDt = (time - lastTime) / 16.667
    const dt = Math.min(rawDt, 3)

    lastTime = time

    const repelRadius = isPressed ? 160 : 100
    const repelPower = isPressed ? 28 : 9

    clouds.forEach((cloud) => {
      if (!isInside) return

      const dx = cloudCenterX(cloud) - mouse.x
      const dy = cloudCenterY(cloud) - mouse.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < repelRadius && distance > 1) {
        const falloff = 1 - distance / repelRadius
        const force = repelPower * falloff * falloff

        applyForce(cloud, {
          x: (dx / distance) * force,
          y: (dy / distance) * force
        })
      }
    })

    for (let i = 0; i < clouds.length; i++) {
      for (let j = i + 1; j < clouds.length; j++) {
        collideClouds(clouds[i], clouds[j])
      }
    }

    clouds.forEach((cloud) => {
      updateCloud(cloud, dt)
      renderCloud(cloud)
    })

    requestAnimationFrame(loop)
  }

  requestAnimationFrame(loop)
})()
