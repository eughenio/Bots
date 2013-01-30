// Bot: Eughenio
// Ruleset: default
// --------------------------------------------------

var Eughenio = function() {};

Eughenio.prototype = new Bot();

Eughenio.prototype.setup = function() {
	this.target = undefined;
	this.strafe = 75;

	// Field stuff
	this.attrStrength = 8;
	this.safety = 9;
	this.repStrength = 4;

	this.opponent = -1;
};

Eughenio.prototype.acquireTarget = function() {
	var target = undefined;
	var distance = 60000;

	for (i in this.state.bots) {
		var bot = this.state.bots[i];

		if (bot.name != this.name) {
			if (this.myDistanceToPoint(bot.x, bot.y) < distance) {
                target = bot;

				this.state.payload.targets[this.id] = bot.id;

				distance = this.myDistanceToPoint(bot.x, bot.y);
			}
		}
	}

	return target;
}

Eughenio.prototype.checkCollisions = function(point) {
	var collision = false;
	var type = '';
	var object = undefined;

	var obstacles = server.getObstacles();
	var bots = server.getBots();

	for (i in bots) {
		bot = bots[i];
		if (server.collisionBot(bot, point)) {
			collision = true;
			type = 'bot';
			object = bot;
			break;
		}
	}

	if (!collision) {
		for (i in obstacles) {
			obstacle = obstacles[i];
			if (server.collisionObstacle(obstacle, point)) {
				collision = true;
				type = 'obstacle';
				object = obstacle;
				break;
			}
		}
	}

	if (!collision && server.collisionBoundary(point)) {
		collision = true;
		type = 'boundary';
		object = undefined;
	}
	
	return { collision: collision, type: type, object: object };
}

Eughenio.prototype.distanceToCollision = function(x, y, angle) {
	var speed = 5;
	var newPoint = { x: x, y: y };
	var response = {};
	response.collision = false;

	while (!response.collision) {
		newPoint = server.helpers.calcVector(newPoint.x, newPoint.y, angle, speed);

		response = this.checkCollisions(newPoint);
	}

	distance = this.myDistanceToPoint(newPoint.x, newPoint.y);

	return { distance: distance, type: response.type, object: response.object };
}

Eughenio.prototype.myDistanceToCollision = function() {
	var pos = server.helpers.calcVector(this.x, this.y, this.angle, this.radius + 1);

	return this.distanceToCollision(pos.x, pos.y, this.angle);
}

/*-------------------------*/

Eughenio.prototype.run = function() {
	var command = '';

	if (typeof this.state.payload.targets == 'undefined') {
		this.state.payload.targets = {}
	};

	this.target = this.acquireTarget();

	var dtc = this.myDistanceToCollision(this.x, this.y, this.angle);

	var dir = this.getDirection(this.target, 0.05);

	var dist = this.myDistanceToPoint(this.target.x, this.target.y);

	var aimingAtEnemy = (dtc.type == 'bot' && dtc.object.name != this.name);

	var aimingAtTeam = (dtc.type == 'bot' && dtc.object.name == this.name);

	var aimingAtCloseObstacle = (dtc.type == 'obstacle' && dtc.distance < 150);

	var aimingAtCloseBoundary = (dtc.type == 'boundary' && dtc.distance < 150);

	if (this.canShoot && this.weapons.bullet > 0 && aimingAtEnemy) {
		command = 'fire';
	} else {
		if (dir.command != 'forward') {
			command = dir.command;
		} else {
			if(aimingAtCloseBoundary || aimingAtTeam || aimingAtCloseObstacle){
				command = (this.strafe > 50) ? 'strafe-left' : 'strafe-right';

				if (this.strafe > 0) {
					this.strafe--;
				} else {
					this.strafe = 170;
				}
			} else if (dist > 400 && this.canShoot && this.weapons.bullet > 0 && (!aimingAtCloseObstacle || !aimingAtCloseBoundary)) {
				command = 'fire';
			} else if (dist > 100){
				command = (this.strafe > 50) ? 'strafe-left' : 'strafe-right';

				if (this.strafe > 0) {
					this.strafe--;
				} else {
					this.strafe = 150;
				}
			} else if (dist > 100 && (!aimingAtCloseObstacle || !aimingAtCloseBoundary || !aimingAtEnemy)) {
				command = 'forward';
			} else {
				command = (this.strafe > 50) ? 'strafe-left' : 'strafe-right';

				if (this.strafe > 0) {
					this.strafe--;
				} else {
					this.strafe = 100;
				}
			}
		}
	}

	return { 'command': command, 'team': this.state.payload };
};

server.registerBotScript("Eughenio");
