
class AtonalMonoSynth {
	constructor (options = {}) {
		this.doc = options.document
		this.target = options.target 
		this.width = options.width || "100%"
		this.height = options.height || "400px"

		this.initialized = false
		this.MAX_FREQ = 6000;
		this.MAX_VOL = 0.35;
		this.INIT_VOL = 0;

		if (this.target && typeof this.target.appendChild === "function") {
			this.mount(this.doc, this.target)
		}
	}

	initAudio () {
		if (this.initialized) return
		this.initialized = true

		const AudioContext = document.defaultView.AudioContext
			|| document.defaultView.webkitAudioContext
		this.audioCtx = new AudioContext()

		// create Oscillator and gain node
		this.osc1 = this.audioCtx.createOscillator();
		this.gainNode = this.audioCtx.createGain();

		// connect oscillator to gain node to speakers
		this.osc1.connect(this.gainNode);
		this.gainNode.connect(this.audioCtx.destination);
		
		// set options for the oscillator
		this.osc1.type = "sawtooth"
		this.osc1.detune.value = 100; // value in cents
		this.osc1.start(0);

		this.osc1.onended = function () {
			console.log("Your tone has now stopped playing!");
		};

		this.gainNode.gain.value = this.INIT_VOL;
		// this.gainNode.gain.minValue = this.INIT_VOL;
		// this.gainNode.gain.maxValue = this.INIT_VOL;
		
		this.inRibbon.addEventListener("input", evt => {
			const freq = 440 * Math.pow(2, (evt.target.value - 50) / 24)
			this.setPitch(freq)
			// this.gainNode.gain.value = (KeyY / HEIGHT) * maxVol;
		})

		this.inRibbon.addEventListener("mouseenter", evt => {
			this.setGain(100)
		})
		this.inRibbon.addEventListener("mouseleave", evt => {
			this.setGain(0)
		})
	}

	setPitch (freq) {
		if (this.initialized)
			this.osc1.frequency.value = freq
	}

	setGain (ratio) {
		if (this.initialized)
			this.gainNode.gain.value = ratio * this.MAX_VOL
	}

	mount (document = null, target = null) {
		document = document || this.doc
		target = target || this.target
		if (!document || typeof document.createElement !== "function")
			throw new Error("Invalid document object")
		if (!target || typeof target.appendChild !== "function")
			target = document.body

		target.appendChild(this.create(this.doc))
		this.log("ready")
	}

	create (document = null) {
		document = document || this.doc
		if (!document || typeof document.createElement !== "function")
			throw new Error("Invalid document object")

		this.container = document.createElement("div")
		
		this.inRibbon = document.createElement("input")
		this.inRibbon.type = "range"

		this.container.appendChild(this.inRibbon)

		return this.container
	}

	log(message) {
		console.log(message)
	}
}

class AtonalController {
	constructor (options = {}) {
		this.doc = options.document
		this.target = options.target 
		this.width = options.width || "100%"
		this.height = options.height || "400px"
		this.pos = options.position || 50
		this.zoom = options.zoom || 100
		this.HIT_TIME = options.HIT_TIME || 1000
		this.HIT_ZONE = options.HIT_ZONE || 200
		this.TRACK_ZONE = options.TRACK_ZONE || 5

		//this.mode = "touch"
		this.events = []
		this.refreshing = false
		this.clicking = false
		
		if (this.target && typeof this.target.appendChild === "function") {
			this.mount(this.doc, this.target)
		}
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
		this.canvas.style.width = "100%"
		this.canvas.style.height = "100%"

		this.canvasContainer = document.createElement("div")
		this.canvasContainer.style.flex = 4
		this.canvasContainer.style.overflow = "show"
		this.canvasContainer.appendChild(this.canvas)

		this.canvas.ontouchstart = this.trackStart.bind(this)
		this.canvas.ontouchmove = this.trackMove.bind(this)
		this.canvas.ontouchcancel = this.trackEnd.bind(this)
		this.canvas.ontouchEnd = this.trackEnd.bind(this)

		this.canvas.onmousedown = this.trackStart.bind(this)
		this.canvas.onmousemove = this.trackMove.bind(this)
		this.canvas.onmouseup = this.trackEnd.bind(this)
		this.canvas.onmouseleave = this.trackEnd.bind(this)

		this.display = this.canvas.getContext("2d")

		this.logs = document.createElement("div")
		// this.logs.style.height = "100%"
		//this.logs.style.minWidth = "40%"
		this.logs.style.flex = 1
		this.logs.style.overflow = "auto"
		
		this.container.appendChild(this.canvasContainer)
		this.container.appendChild(this.logs)
		
		this.monoSynth = new AtonalMonoSynth({
			document: this.doc,
			target: this.container
		})
		this.monoSynth.container.style.flex = 1

		this.container.addEventListener(
			"click",
			this.monoSynth.initAudio.bind(this.monoSynth)
		)
		this.container.addEventListener(
			"touchstart",
			this.monoSynth.initAudio.bind(this.monoSynth)
		)

		//document.onresize = this.resize.bind(this)
		document.defaultView.addEventListener("resize", this.resize.bind(this), true)

		return this.container
	}

	resize () {
		const styles = getComputedStyle(this.canvasContainer)
		this.canvas.width = parseInt(styles.getPropertyValue("width"), 10)
		this.canvas.height = parseInt(styles.getPropertyValue("height"), 10)
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
					this.display.lineWidth = 5 * (1 - percent) * e.factor
					this.display.stroke();
					e.ended = time > this.HIT_TIME * 2
					break
			}
		}

		this.events = this.events.filter(e => !e.ended)
	}

	note (x, y) {
		const w = this.canvas.width
		this.monoSynth.setPitch(440 * Math.pow(2, (x - w / 2) * 50 / w / 12))
		this.monoSynth.setGain(1 - y / this.canvas.height)
	}

	trackStart (evt) {
		evt.preventDefault()
		//console.log(evt)

		const x = evt.offsetX
		const y = evt.offsetY

		this.note(x, y)

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
		//console.log(evt)

		const x = evt.offsetX
		const y = evt.offsetY

		this.note(x, y)

		const contact = this.events.filter(e => e.type === "contact")[0]
		contact.x = x
		contact.y = y

	}
	trackEnd (evt) {
		evt.preventDefault()
		if (!this.clicking) return
		//console.log(evt)

		this.monoSynth.setGain(0)

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