// ---- MODEL ----
// calculator object -- stores state and calculator functionality
const Calculator = {
  // state
  currOperation: null,
  prevOperation: null,

  // methods
  newBinaryOperation: function (operator, x) {
    // return an operation function that is executed when Calculator.execute is called
    Screen.newNum = true;
    Calculator.prevOperation = null;
    Calculator.currOperation = (y) => {
      Screen.newNum = true;
      Calculator.newPrevOperation(operator, y);
      return BinaryOperators[operator](x, y);
    };
  },

  newPrevOperation: function (operator, y) {
    Calculator.prevOperation = (x) => BinaryOperators[operator](x, y);
  },
  applyUnaryOperation: function (operator, x) {
    Screen.newNum = true;
    Screen.display(UnaryOperators[operator](x));
  },

  execute: function (y) {
    if (Calculator.prevOperation) {
      results = Calculator.prevOperation(y);
    } else {
      results = Calculator.currOperation(y);
    }
    Screen.newNum = true;
    Screen.display(results);
  },
};

// Store operations to be used by the calculator
const BinaryOperators = {
  add: (x, y) => x + y,
  sub: (x, y) => x - y,
  mul: (x, y) => x * y,
  div: (x, y) => {
    if (y === 0) return "ERR";
    return x / y;
  },
  mod: (x, y) => {
    if (y === 0) return "ERR";
    return x % y;
  },
  exp: (x, y) => x ** y,
};

const UnaryOperators = {
  inv: (x) => 1 / x,
  sqrt: (x) => Math.sqrt(x),
  log: (x) => Math.log(x),
};

// ---- VIEW ----
// screen receives output of model

const Screen = {
  screen: document.querySelector("#screen"),
  newNum: false,
  display: function (results) {
    Screen.screen.textContent = this.trimResults(results);
  },
  trimResults: function (results) {
    // Format results to fit screen
    if (!results.toString().includes("ERR")) {
      // Skip tests if results are an error
      if (results.toExponential().split("e")[1] > 8) {
        // represent large numbers using e notation
        results = results.toExponential(2);
      } else if (results.toExponential().split("e")[1] < -7) {
        // represent small numbers using e notation
        results = results.toExponential(2);
      } else if (results.toString().length > 9) {
        // truncate long decimals
        results = results.toString().substring(0, 8);
      }
    }
    return results;
  },
};

// ---- CONTROLLER ----
// all buttons under one SelectorAll
// all have one event listener -- uses id to choose operation
const clearButtons = document.querySelectorAll(".clear");
const rootButton = document.querySelector("#root");
const numberButtons = document.querySelectorAll(".numbers");
const operatorButtons = document.querySelectorAll(".operators");
const signButton = document.querySelector("#sign");
const decimalButton = document.querySelector("#decimal");
const equalsButton = document.querySelector("#equals");

clearButtons.forEach((clearButton) => {
  clearButton.addEventListener("click", clearButtonPress);
});

numberButtons.forEach((numButton) => {
  numButton.addEventListener("click", numButtonPress);
});

operatorButtons.forEach((opButton) => {
  opButton.addEventListener("click", opButtonPress);
});

rootButton.addEventListener("click", () => {
  if (screen.textContent.includes("ERR")) return; // do nothing if error
  result = Math.sqrt(+screen.textContent);
  result = trimResults(result);
  screen.textContent = result;
});

signButton.addEventListener("click", toggleSign);
decimalButton.addEventListener("click", decimalAdd);
equalsButton.addEventListener("click", equals);

function Operation(operator, x) {
  this.operator = operator;
  this.x = x;
  this.y;
  this.operate = function () {
    return this.operator(this.x, this.y);
  };
}

function clearButtonPress(event) {
  // Clear the screen and all variables
  if (event.target.id === "CE") {
    // Clear screen only
    screen.textContent = "0";
  } else {
    // Clear all
    currOperation = null;
    prevOperation = null;
    screen.textContent = "0";
  }
}

function numButtonPress(event) {
  num = event.target.id;
  if (newNum) {
    if (screen.textContent.includes("ERR")) {
      // first check for error and reset prevOperation if present
      prevOperation = null;
    }
    // Reset screen when entering next number
    screen.textContent = num;
    newNum = false;
  } else if (screen.textContent.length === 9) {
    // if entered number would exceed the length of the screen, do nothing
    return;
  } else if (screen.textContent === "0") {
    // If screen is 0, reset it with next entered number
    // But only if the number is not 0
    if (num !== "0") {
      screen.textContent = num;
    }
    // otherwise, add the number to the end of the screen
  } else {
    screen.textContent += num;
  }
}

function opButtonPress(event) {
  // If another operation started, complete it before starting the next one
  if (currOperation) {
    equals();
  }
  if (screen.textContent.includes("ERR")) return; // do nothing if error present
  let operator = operators[event.target.id];
  let num = +screen.textContent;
  currOperation = new Operation(operator, num);
  newNum = true;
  prevOperation = null;
}

function toggleSign(_) {
  // Don't toggle if screen is 0 or error
  if (screen.textContent === "0" || screen.textContent.includes("ERR")) {
    return;
    // Remove '-' if present
  } else if (screen.textContent[0] === "-") {
    screen.textContent = screen.textContent.substring(1);
    // Add '-' if not present
  } else {
    screen.textContent = "-" + screen.textContent;
  }
}

function decimalAdd(_) {
  if (screen.textContent.includes("ERR")) return;
  if (
    !screen.textContent.includes(".") &&
    !screen.textContent.includes("ERR")
  ) {
    // only add a decimal if none present and no error
    screen.textContent += ".";
  }
}

function equals(_) {
  // don't do anything if no operation started
  if (currOperation || prevOperation) {
    if (prevOperation) {
      // check for previous operation to repeat
      let x = +screen.textContent;
      prevOperation.x = x;
      currOperation = prevOperation;
    } else if (currOperation) {
      // if no previous, use current
      let y = +screen.textContent;
      // Assume y = 0 if a new number hasn't been entered yet
      if (newNum) {
        y = 0;
        newNum = false;
      }
      currOperation.y = y;
    }
    let results = currOperation.operate(currOperation.x, currOperation.y);
    results = trimResults(results);
    screen.textContent = results.toString();
    // save previous operation
    prevOperation = currOperation;
    prevOperation.x = null;
    // reset current operation and screen
    currOperation = null;
    newNum = true;
  }
}

function trimResults(results) {}
