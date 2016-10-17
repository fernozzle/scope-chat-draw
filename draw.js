const NANO = 1000000000;
function messageId(mess) {
	return mess.time + '-' + mess.uid;
}
function pad(n, width, z) {
	z = z || '0';
	n = n + '';
	return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

const req = new XMLHttpRequest();
req.open('get', '../BFDI_NYCC_MEETUP.json');
req.onload = () => {
	const {messages, users} = JSON.parse(req.responseText);

	const container = d3.select('#container')
		.style('width',  '400px')
		.style('height', '500px')
		.style('background', 'black')
		.style('overflow', 'hidden');

	const FPS = 1;
	const DURATION = 10;

	let time = messages[0].time;
	let frame = 0;
	const render = () => {
		const visibleMessages = messages.filter(message => (
			time >= message.time &&
			time <  message.time + DURATION * NANO &&
			message.type === 'text'
		));

		const ps = container.selectAll('article').data(visibleMessages, messageId);

		const MARGIN = 10;
		const AVI_SIZE = 40;
		const BORDER = 2;
		const newPs = ps.enter().append('article')
			.style('background', 'white')
			.style('margin', '7px')
			.style('position', 'relative')
		const content = newPs.append('div')
			.style('font-family', 'Arial')
			.style('letter-spacing', '2px')
			.style('padding', MARGIN + 'px')
			.style('padding-left', (2 * MARGIN + AVI_SIZE + 2) + 'px')
		content.append('header')
			.text(mess => '@' + users[mess.uid].username)
			.style('margin', '0 0 4px')
			.style('font-style', 'italic')
		content.append('p')
			.text(mess => mess.body)
			.style('margin', '0')

		const imageProms = [];
		const SHIM = 'data:image/gif;base64,R0lGODlhAQABAPAAAP///////yH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==';
		newPs.append('img')
			.style('position', 'absolute')
			.style('top', MARGIN + 'px')
			.style('left', MARGIN + 'px')
			.style('width',  (AVI_SIZE - 2 * BORDER) + 'px')
			.style('height', (AVI_SIZE - 2 * BORDER) + 'px')
			.style('border', '2px solid black')
			.each(function(mess) {
				// Make sure all icons are loaded before proceeding
				imageProms.push(new Promise((resolve, reject) => {
					this.onload = () => resolve();
					this.onerror = () => {
						this.src = SHIM;
						resolve();
					};
				}));
				this.src = users[mess.uid].icon;
			});
		ps.exit().remove();


		Promise.all(imageProms).then(() => {
			return domtoimage.toBlob(container.node());
		}).then(blob => {
			saveAs(blob, `scope-${pad(frame, 8)}.png`);

			time += NANO / FPS;
			frame++;
			window.requestAnimationFrame(render);
		});
	};
	d3.select('button#doit').on('click', render);
};
req.send();
