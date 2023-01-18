

class AtonalController {
	constructor (options = {}) {
		this.doc = options.document
		this.target = options.target 
		this.width = options.width || "100%"
		this.height = options.height || "400px"
		this.pos = options.position || 50
		this.zoom = options.zoom || 100
		this.HIT_TIME = options.HIT_TIME || 300
		this.HIT_ZONE = options.HIT_ZONE || 100
		this.TRACK_ZONE = options.TRACK_ZONE || 5

		this.events = []
		this.refreshing = false
		this.clicking = false
		
		this.mount(this.doc, this.target)
		this.resize()

		this.refreshInterval = setInterval(
			this.refresh.bind(this),
			1000 / 60
		)
	}

	mount(document = null, target = null) {
		document = document || this.doc
		target = target || this.target
		if (!document || typeof document.createElement !== "function")
			throw new Error("Invalid document object")
		if (!target || typeof target.appendChild !== "function")
			target = document.body

		target.appendChild(this.create(this.doc))
		this.draw()
		this.log("ready")
	}

	create(document = null) {
		document = document || this.doc
		if (!document || typeof document.createElement !== "function")
			throw new Error("Invalid document object")
		
		this.container = document.createElement("div")

		this.container.style.height = this.height
		this.container.style.width = this.width
		this.container.style.display = "flex"

		this.canvas = document.createElement("canvas")
		this.canvas.appendChild(
			document.createTextNode("Your browser does not support canvas")
		)
		//this.canvas.style.width = "60%"
		//this.canvas.style.height = "80%"
		this.canvas.style.flex = 1

		// this.canvas.ontouchstart = this.touchStart.bind(this)
		// this.canvas.ontouchmove = this.touchMove.bind(this)
		// this.canvas.ontouchcancel = this.touchEnd.bind(this)
		// this.canvas.ontouchEnd = this.touchEnd.bind(this)

		this.canvas.onmousedown = this.trackStart.bind(this)
		this.canvas.onmousemove = this.trackMove.bind(this)
		this.canvas.onmouseup = this.trackEnd.bind(this)
		this.canvas.onmouseleave = this.trackEnd.bind(this)

		this.display = this.canvas.getContext("2d")

		this.logs = document.createElement("div")
		// this.logs.style.height = "100%"
		this.logs.style.minWidth = "40%"
		this.logs.style.flex = 1
		this.logs.style.overflow = "auto"
		
		this.container.appendChild(this.canvas)
		this.container.appendChild(this.logs)

		document.onresize = this.resize.bind(this)

		return this.container
	}

	resize () {
		console.log(this.canvas.getBoundingClientRect())
		this.canvas.width = this.canvas.getBoundingClientRect().width
		this.canvas.height = this.canvas.getBoundingClientRect().height
		this.draw()
	}

	log (message) {
		const log = document.createElement("p")
		log.appendChild(document.createTextNode("> " + message))
		this.logs.appendChild(log)
	}

	refresh () {
		//if (this.refreshing) {
			//console.log("refreshing")
			this.draw()
			if (this.events.length === 0) {
				this.refreshing = false
			}
		//}
	}

	draw() {
		this.display.fillStyle = "#112"
		this.display.fillRect(0, 0, this.canvas.width, this.canvas.height)

		this.display.fillStyle = "#fff"
		this.display.strokeStyle = '#fff';
		for (let e of this.events) {
			switch (e.type) {
				case "contact":
					this.display.beginPath()
					this.display.arc(e.x, e.y, this.TRACK_ZONE, 0, 2 * Math.PI, false)
					this.display.fill()
					break
				case "hit":
					const time = Date.now() - e.date
					const percent = time / this.HIT_TIME * e.factor
					const radius = this.HIT_ZONE * percent
					this.display.beginPath()
					this.display.arc(e.x, e.y, radius, 0, 2 * Math.PI, false)
					this.display.lineWidth = 10 * (1 - percent) * e.factor
					this.display.stroke();
					e.ended = time > this.HIT_TIME
					break
			}
		}

		this.events = this.events.filter(e => !e.ended)
	}

	trackStart (evt) {
		evt.preventDefault()
		this.log("touchstart")
		//console.log(evt)

		const x = evt.offsetX
		const y = evt.offsetY

		const event1 = {
			type: "contact",
			startX: x,
			startY: y,
			x,
			y
		}

		const event2 = {
			type: "hit",
			x,
			y,
			factor: 1,
			date: Date.now()
		}

		this.events.push(event1)
		this.events.push(event2)
		this.refreshing = true
		this.clicking = true
	}
	trackMove (evt) {
		evt.preventDefault()
		if (!this.clicking) return
		this.log("touchmove")
		//console.log(evt)

		const x = evt.offsetX
		const y = evt.offsetY

		this.events[0].x = x
		this.events[0].y = y
	}
	trackEnd (evt) {
		evt.preventDefault()
		if (!this.clicking) return
		this.log("touchend")
		//console.log(evt)

		const x = evt.offsetX
		const y = evt.offsetY

		this.events = this.events.filter(e => e.type !== "contact")

		const event = {
			type: "hit",
			x,
			y,
			factor: 0.5,
			date: Date.now()
		}

		this.events.push(event)

		this.clicking = false
	}
}