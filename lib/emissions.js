function emissionsCalc (movementArray) {
  const initial = {air: 0, car: 0, bus: 0, train: 0, total: 0};
  const emissions = movementArray.reduce(switchCalc, initial);
  return emissions;
};

function calcCar (distance) {
  //this is pounds CO2
  //1.08 is based on 23 mpg with single passenger
  return Math.round( ( 1.08 * distance ) * 100 ) / 100;
  // return 1.08 * distance;
};

function calcBus (distance) {
  //number for transit buses => 1300 g/km per bus (not per capita)
  //instead I'm using "motor coach (between cities)" numbers
  //0.17 pounds CO2 per mile
  return Math.round( ( 0.17 * distance ) * 100 ) / 100;
  // return 0.17 * distance;
};

function calcTrain (distance) {
  //using avg of diesel and electric train numbers
  //which is 0.41 pounds CO2 per mile
  return Math.round( ( 0.41 * distance ) * 100 ) / 100;
  // return 0.41 * distance;
};

function calcAir (distance) {
  //pounds CO2, calculates per mile as well as
  //pounds per flight related to take-off and landing
  //based on averages for narrow-body jets
  return Math.round( ( (0.38 * distance) + 33 ) * 100 ) / 100;
  // return (0.38 * distance) + 33;
}

function switchCalc (accumulator, movement) {
  switch (movement.mode) {
  case 'car':
    accumulator.car += calcCar(movement.distance);
    accumulator.total += calcCar(movement.distance);
    break;
  case 'air':
    accumulator.air += calcAir(movement.distance);
    accumulator.total += calcAir(movement.distance);
    break;
  case 'bus':
    accumulator.bus += calcBus(movement.distance);
    accumulator.total += calcBus(movement.distance);
    break;
  case 'train':
    accumulator.train += calcTrain(movement.distance);
    accumulator.total += calcTrain(movement.distance);
    break;
  default:
    accumulator.car += calcCar(movement.distance);
    accumulator.total += calcCar(movement.distance); 
  }
  return accumulator;
}

module.exports = emissionsCalc;