(() => {
	const SIZE = 5;
	const SCREENS = {
		START: document.getElementById('start'),
		GAME: document.getElementById('game')
	};


	const score = {
		points: null,
		attempts: null,
		duration: null,
		element: null
	};
	const highscore = {
		points: null,
		attempts: null,
		duration: null,
		element: document.getElementById('highscore')
	};
	let started = null;
	const cards = {};
	let waiting = false;
	const clicked = [];

	document.getElementById('start-game').addEventListener('click', () => {
		setScreen(SCREENS.GAME);

		SCREENS.GAME.innerHTML = '';
		started = Date.now();
		score.points = 0;


		const scoreIndex = (SIZE * SIZE - 1) / 2;

		let values = [ ...Array((SIZE * SIZE - 1) / 2).keys() ];
		values = values.concat(values);
		values.sort(() => Math.random() - 0.5);

		const cardNodes = [ ...Array(SIZE * SIZE).keys() ].reduce((frag, i) => {
			if (i === scoreIndex){
				const node = document.createElement('div');
				node.id = 'score';
				node.textContent = score.points;
				score.element = node;

				frag.appendChild(node);
				return frag;
			}
			const points = values[i < scoreIndex ? i : i - 1];

			const element = document.createElement('div');
			element.className = 'card';
			element.dataset.index = i.toString();
			element.addEventListener('click', clickCard);
			cards[i] = { element, points };

			const cardInner = document.createElement('div');
			cardInner.className = 'card-inner';

			const cardFront = document.createElement('div');
			cardFront.className = 'card-front';

			const cardBack = document.createElement('div');
			cardBack.className = 'card-back';

			const cardValue = document.createElement('p');
			cardValue.textContent = points.toString();


			cardBack.appendChild(cardValue);
			cardInner.appendChild(cardFront);
			cardInner.appendChild(cardBack);
			element.appendChild(cardInner);
			frag.appendChild(element);
			return frag;
		}, document.createDocumentFragment());

		SCREENS.GAME.appendChild(cardNodes);
	});

	const getAncestor = (element, check) => {
		let parent = element.parentNode;
		do {
			parent = parent.parentNode;
			if (check(parent)) return parent;
		} while(parent);

		return null;
	}

	const setScreen = visibleNode => Object.values(SCREENS).forEach((element) =>
		element.style.display = element === visibleNode ? null : 'none'
	)
	

	const updateHighscore = score => {
		score.element.textContent = `${score.points} in ${score.attempts} attempts and ${(score.duration / 1000).toFixed(0)} seconds`;
	}

	const flipCard = card => {
		card.flipped = card.element.classList.toggle('flipped');
	}

	async function clickCard(event){
		if (waiting){
			return;
		}
		
		const current = Number(getAncestor(event.target, element => element.dataset.index).dataset.index)
		if (clicked[0] === current){
			return;
		}

		clicked.push(current);
		flipCard(cards[current]);
		if (clicked.length !== 2){
			return;
		}
		score.attempts++;
		await wait(750);

		const clickedCards = clicked.map(index => cards[index]);
		clicked.splice(0, clicked.length);
		
		const matching = clickedCards.every(card => card.points === clickedCards[0].points);
		let cardAction = null;
		if (matching){
			cardAction = card => {
				card.element.classList.add('matched');
				card.element.removeEventListener('click', clickCard);
			}

			score.points++;
			score.element.textContent = score.points;
		}
		else{
			cardAction = flipCard;
		}
		clickedCards.forEach(cardAction);

		if (!highscore.points){

			saveScore(Object.assign({}, score, { duration: Date.now() - started }));
		}

		return Object.values(cards).every(card => card.flipped) && handleWin();
	}

	const handleWin = () => {
		const ended = Date.now();
		score.duration = ended - started;

		const hasHighscore = highscore.points !== null;
		const betterPoints = score.points >= highscore.points;
		const betterAttempts = score.attempts <= highscore.attempts;
		const betterTime = score.duration <= highscore.duration;
		const betterScore = betterPoints && (betterTime || betterAttempts);
		const setHighscore = !hasHighscore || betterScore;

		alert(`You got ${score.points} points in ${score.attempts} attempts and ${score.duration} seconds${!setHighscore ? '.' : ', setting a new high score!'}`)

		if (setHighscore){
			Object.assign(highscore, score, { element: highscore.element });
			updateHighscore(highscore);
			saveScore(highscore);
		}

		setScreen(SCREENS.START);
	}

	const saveScore = score => {
		localStorage.setItem('highscore', JSON.stringify(score, (key, value) => key === 'element' ? undefined : value));
	}

	const wait = ms => {
		if (ms === null) return;

		return new Promise(resolve => {
			waiting = true;
			SCREENS.GAME.classList.add('waiting');
			document.getElementById('debug').style.backgroundColor = 'red';
			setTimeout(() => {
				waiting = false;
				SCREENS.GAME.classList.remove('waiting');
				document.getElementById('debug').style.backgroundColor = 'green';
				resolve();
			}, ms);
		})
	}

	const lsScore = localStorage.getItem('highscore');
	if (lsScore){
		Object.assign(highscore, JSON.parse(lsScore));
		updateHighscore(highscore);
	}

	return { score, highscore, cards, clicked, win: () => Object.values(cards).forEach(c => c.flipped = true) || handleWin() };
})();
