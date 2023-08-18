import p5 from "p5";
import KDBush from "kdbush";

const RADIUS = 5;

class Circle {
  radius = RADIUS;
  constructor(x, y, vX, vY) {
    this.x = x;
    this.y = y;
    this.vX = vX;
    this.vY = vY;
  }

  draw = (p) => {
    p.circle(this.x, this.y, this.radius);
  };

  // todo : should probably consider delta time from the last time rendered
  updatePosition = () => {
    this.x = this.x + this.vX;
    this.y = this.y + this.vY;
  };

  isCollisingWithOtherCircle = (otherCircle) => {
    if (otherCircle === this) {
      return false;
    }

    const otherX = otherCircle.x;
    const otherY = otherCircle.y;

    const diffXSquared = (otherX - this.x) ** 2;
    const diffYSquared = (otherY - this.y) ** 2;
    const radiusSumSquared = (this.radius + otherCircle.radius) ** 2;

    if (diffXSquared + diffYSquared <= radiusSumSquared) {
      // collision happened
      return true;
    }

    return false;
  };

  // assuming this will be called for each pair of circles only once in one go
  handleCollisionWithOtherCircle = (otherCircle) => {
    if (this.isCollisingWithOtherCircle(otherCircle)) {
      // assuming for point masses, just the velocity is swapped
      let tmp = this.vX;
      this.vX = otherCircle.vX;
      otherCircle.vX = tmp;

      tmp = this.vY;
      this.vY = otherCircle.vY;
      otherCircle.vY = tmp;
    }
  };

  handleWallCollision = (width, height) => {
    // horizontal collisions
    if (this.x - this.radius <= 0) {
      this.x = this.radius;
      this.vX = -this.vX;
    }

    if (this.x + this.radius >= width) {
      this.x = width - this.radius;
      this.vX = -this.vX;
    }

    // vertical collisions
    if (this.y - this.radius <= 0) {
      this.y = this.radius;
      this.vY = -this.vY;
    }

    if (this.y + this.radius >= height) {
      this.y = height - this.radius;
      this.vY = -this.vY;
    }
  };
}

const circles = [];

const generateRandomNumber = (min = 0, max = 1) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const addCircles = (width, height,arrayRef = circles ,circleCount = 15) => {
  arrayRef.splice(0, arrayRef.length); // clear the array

  for (let i = 1; i <= circleCount; i++) {
    let colliding = true;
    let circle = null;

    while (colliding) {
      const randomVx = generateRandomNumber(0, 5);
      const randomVy = generateRandomNumber(0, 5);

      const gap = 10;

      const randomX = generateRandomNumber(0 + gap, width - gap)
      const randomY = generateRandomNumber(0 + gap, height - gap);
      circle = new Circle(randomX, randomY, randomVx, randomVy);

      colliding = arrayRef.reduce(
        (result, currentCircle) =>
          result || circle.isCollisingWithOtherCircle(currentCircle),
        false
      );
    }
    arrayRef.push(circle);
  }
};

const sketch = (p) => {
  const width = 1920;
  const height = 1080;

  let slider;
  let previousSliderVal;
  let checkbox;

  // addCircles(width, height);

  p.setup = () => {
    p.createCanvas(width, height);

    checkbox = p.createCheckbox('Use Optimization');

    slider = p.createSlider(50, 2500, 50, 50);
    previousSliderVal = 50; // starting with 50 circles

    addCircles(width, height, circles, previousSliderVal);
  };

  p.draw = () => {
    p.background(220);

    if(slider.value() != previousSliderVal) { // if slider value changed .. add circles again
      addCircles(width, height, circles, slider.value());
      previousSliderVal = slider.value();
    }

    circles.forEach((c) => c.draw(p)); // draw circles for this frame

    if(checkbox.checked()) { // run with optimization
      const index = new KDBush(circles.length);

      circles.forEach(circle => {
        circle.handleWallCollision(width, height);
        index.add(circle.x, circle.y);
      });

      index.finish();
      for(let i = 0; i < circles.length; i++) {
        const collidedIdxs = index.within(circles[i].x, circles[i].y, 3*RADIUS);
        collidedIdxs.forEach(j => {
          if(i < j) {
            circles[i].handleCollisionWithOtherCircle(circles[j]);
          }
        })
      }
    }

    else { // run without optimization
      circles.forEach((c) => c.handleWallCollision(width, height));

      for (let i = 0; i < circles.length; i++) {
        for (let j = i + 1; j < circles.length; j++) {
          circles[i].handleCollisionWithOtherCircle(circles[j]);
        }
      }
    }


    circles.forEach((c) => c.updatePosition());
  };
};

new p5(sketch);
