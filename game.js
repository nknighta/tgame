console.log("OMG")

const canvas = document.getElementById("tetris");
const context = canvas.getContext("2d");

let dropCounter = 0;
let dropInterval = 900;
let lastTime = 0;
let animationId;

const createPiece = (type) => {
	if (type === "T") {
		return [
			[0, 0, 0],
			[1, 1, 1],
			[0, 1, 0]
		];
	} else if (type === "O") {
		return [
			[2, 2],
			[2, 2]
		];
	} else if (type === "L") {
		return [
			[0, 3, 0],
			[0, 3, 0],
			[0, 3, 3]
		];
	} else if (type === "J") {
		return [
			[0, 4, 0],
			[0, 4, 0],
			[4, 4, 0]
		];
	} else if (type === "I") {
		return [
			[0, 0, 0, 0],
			[5, 5, 5, 5],
			[0, 0, 0, 0],
			[0, 0, 0, 0]
		];
	} else if (type === "S") {
		return [
			[0, 6, 6],
			[6, 6, 0],
			[0, 0, 0]
		];
	} else if (type === "Z") {
		return [
			[7, 7, 0],
			[0, 7, 7],
			[0, 0, 0]
		];
	}
}

const colors = [
	null,
	"#FF0D72",
	"#0DC2FF",
	"#0DFF72",
	"#3877FF",
	"#F538FF",
	"#FF8E0D",
	"#FFE138",
];

const drawMatrix = (matrix, offset) => {
	matrix.forEach((row, y) => {
		row.forEach((value, x) => {
			if (value !== 0) {
				context.fillStyle = colors[value];
				context.fillRect(x + offset.x, y + offset.y, 1, 1);
			}
		});
	});
}

context.scale(20, 20);


/**
 * @param {number} w - 行列の幅（列数）
 * @param {number} h - 行列の高さ（行数）
 */
const createMatrix = (w, h) => {
	const matrix = [];
	while (h--) {
		matrix.push(new Array(w).fill(0));
	}
	return matrix;
}

const arena = createMatrix(12, 20);

const player = {
	pos: { x: 0, y: 0 },
	matrix: createPiece('T'), // ※ダミーで設定．後に書き換えます
	score: 0,
};


function draw() {
	context.fillStyle = '#000';
	context.fillRect(0, 0, canvas.width, canvas.height);

	drawMatrix(arena, { x: 0, y: 0 });
	drawMatrix(player.matrix, player.pos);
}


/**
 * @param {number} time - requestAnimationFrameから渡されるタイムスタンプ
 */
const update = (time = 0) => {
	// フレーム間の経過時間の計算
	const deltaTime = time - lastTime;
	lastTime = time;

	// ブロックの落下処理
	dropCounter += deltaTime;
	if (dropCounter > dropInterval) {
		playerDrop();
	}

	draw();
	animationId = requestAnimationFrame(update);
}

const playerDrop = () => {
	player.pos.y++;
	if (collide(arena, player)) {
		player.pos.y--;
		merge(arena, player);
		playerReset();
		arenaSweep();
		updateScore();
	}
	dropCounter = 0;
}


/**
 * @param {object} arena - ゲームフィールドを表す2次元配列
 * @param {object} player - プレイヤーの情報を持つオブジェクトで，現在のピースの形状（matrix）と位置（pos）を含む
 */
const collide = (arena, player) => {
	const [m, o] = [player.matrix, player.pos];
	for (let y = 0; y < m.length; ++y) {
		for (let x = 0; x < m[y].length; ++x) {
			if (m[y][x] !== 0 &&
				(arena[y + o.y] &&
					arena[y + o.y][x + o.x]) !== 0) {
				if (y + o.y <= 0) {
					return true;
				}
				return true;
			}
		}
	}
	return false;
}

const playerReset = () => {
	// ピースの全種類
	const pieces = 'TJLOSZI';
	player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
	player.pos.y = 0;
	player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
	if (collide(arena, player)) {
		// ゲームオーバー
		cancelAnimationFrame(animationId);
	}
}

const updateScore = () => {
	document.querySelector('#score').innerText = player.score;
}


const gameOver = () => {
	cancelAnimationFrame(animationId);
	document.getElementById('restartButton').style.display = 'block';
}

const merge = (arena, player) => {
	player.matrix.forEach((row, y) => {
		row.forEach((value, x) => {
			if (value !== 0) {
				arena[y + player.pos.y][x + player.pos.x] = value;
			}
		});
	});
}

/**
 * @param {number} dir - 1（右） or -1（左）
 */
const playerMove = (dir) => {
	player.pos.x += dir;

	// 衝突判定
	if (collide(arena, player)) {
		player.pos.x -= dir;
	}
}

/**
 * @param {object} arena - ゲームフィールドを表す2次元配列
 * @param {object} player - プレイヤーの情報を持つオブジェクトで，現在のピースの形状（matrix）と位置（pos）を含む
 */
const rotate = (matrix, dir) => {
	for (let y = 0; y < matrix.length; ++y) {
		for (let x = 0; x < y; ++x) {
			[matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
		}
	}

	if (dir > 0) {
		matrix.forEach(row => row.reverse());
	} else {
		matrix.reverse();
	}
}

/**
 * @param {number} dir - 1（右） or -1（左）
 */
const playerRotate = (dir) => {
	const pos = player.pos.x;
	let offset = 1;
	rotate(player.matrix, dir);
	while (collide(arena, player)) {
		player.pos.x += offset;
		offset = -(offset + (offset > 0 ? 1 : -1));
		if (offset > player.matrix[0].length) {
			rotate(player.matrix, -dir);
			player.pos.x = pos;
			return;
		}
	}
}

while (collide(arena, player)) {
	player.pos.x += offset;
	offset = -(offset + (offset > 0 ? 1 : -1));
	if (offset > player.matrix[0].length) {
		rotate(player.matrix, -dir);
		player.pos.x = pos;
	}
}

document.addEventListener('keydown', event => {
	if (event.keyCode === 37) {
		playerMove(-1);
	} else if (event.keyCode === 39) {
		playerMove(1);
	} else if (event.keyCode === 40) {
		playerDrop();
	} else if (event.keyCode === 81) {
		playerRotate(-1);
	} else if (event.keyCode === 87) {
		playerRotate(1);
	}
});

document.getElementById("turnl").addEventListener("click", () => {
	playerRotate(-1);
});

document.getElementById("turnr").addEventListener("click", () => {
	playerRotate(1);
});

document.getElementById("down").addEventListener("click", () => {
	playerDrop();
});

document.getElementById("left").addEventListener("click", () => {
	playerMove(-1);
});

document.getElementById("right").addEventListener("click", () => {
	playerMove(1);
});
const arenaSweep = () => {
	outer: for (let y = arena.length - 1; y > 0; --y) {
		for (let x = 0; x < arena[y].length; ++x) {
			if (arena[y][x] === 0) {
				continue outer;
			}
		}

		const row = arena.splice(y, 1)[0].fill(0);
		arena.unshift(row);
		++y;

		player.score += 14;
	}
}

const restartGame = () => {
	arena.forEach(row => row.fill(0));
	player.score = 0;
	updateScore();
	playerReset();
	lastTime = 0;
	update();
}

document.getElementById('restartBtn').addEventListener('click', restartGame);
playerReset();
update()
