

class AtonalController {
	constructor (options = {}) {
		this.doc = options.document
		this.target = options.target 
		this.width = options.width || "100%"
		this.height = options.height || "400px"
		this.pos = options.position || 50
		this.zoom = options.zoom || 100

		this.events = []
		this.refreshing = false
		
		this.mount(this.doc, this.target)

		this.refreshInterval = setInterval(
			this.refresh.bind(this),
			1000 / 24
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

		this.canvas.ontouchstart = this.touchStart.bind(this)
		this.canvas.ontouchmove = this.touchMove.bind(this)
		this.canvas.ontouchcancel = this.touchEnd.bind(this)
		this.canvas.ontouchEnd = this.touchEnd.bind(this)

		this.canvas.onmousedown = this.touchStart.bind(this)
		this.canvas.ondrag = this.touchMove.bind(this)
		this.canvas.onmouseup = this.touchEnd.bind(this)

		this.display = this.canvas.getContext("2d")

		this.logs = document.createElement("div")
		// this.logs.style.height = "100%"
		this.logs.style.width = "40%"
		this.logs.style.overflow = "auto"
		
		this.container.appendChild(this.canvas)
		this.container.appendChild(this.logs)

		return this.container
	}

	log (message) {
		const log = document.createElement("p")
		log.appendChild(document.createTextNode("> " + message))
		this.logs.appendChild(log)
	}

	refresh () {
		if (this.refreshing) {
			console.log("refreshing")
			this.draw()
		}
	}

	draw() {
		this.display.fillStyle = "#112"
		this.display.fillRect(0, 0, this.canvas.width, this.canvas.height)

		this.display.fillStyle = "#fff"
		for (e of this.events) {
			if (e.type = "contact") {
				this.display.fillCircle(e.x, e.y, 20, 20)
			}
		}
	}

	touchStart (evt) {
		this.log("touchstart")
		console.log(evt)

		const x = evt.offsetX
		const y = evt.offsetY

		const event = {
			type: "contact",
			startX: x,
			startY: y,
			x,
			y
		}

		this.events.push(event)
		this.refreshing = true
	}
	touchMove (evt) {
		this.log("touchmove")
		console.log(evt)
	}
	touchEnd (evt) {
		this.log("touchend")
		console.log(evt)

		this.events.pop()
		if (this.events.length === 0){
			this.refreshing = false
		}
	}
}