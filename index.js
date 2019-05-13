// Глобальные переменные:
const FIELD_SIZE_X = 20
const FIELD_SIZE_Y = 20
const SNAKE_SPEED = 300 // Интервал между перемещениями змейки
const FOOD_SPEED = 5000 // Интервад между созданием еды
const PROBLEM_SPEED = 10000 // интервал между созданием преград =)
let snake = [] // Сама змейка
let direction = 'y+' // Направление движения змейки
let gameIsRunning = false // Запущена ли игра
let snake_timer // Таймер змейки
let food_timer // Таймер еды
let problem_timer // Таймер проблем
let score = 0 // Результат
let btnStart = document.getElementsByClassName('snake-start')[0] //кнопка старта
let btnRenew = document.getElementsByClassName('snake-renew')[0] //кнопка рестарта
let points = document.getElementsByClassName('score-point')[0] //показатель счет

function init() {
  prepareGameField() // Генерация поля
  points.innerHTML = score
  let wrap = document.getElementsByClassName('wrap')[0]
  // Подгоняем размер контейнера под игровое поле
  if (16 * (FIELD_SIZE_X) < 320) wrap.style.width = '320px'
  else wrap.style.width = (16 * (FIELD_SIZE_X)).toString() + 'px'

  // События кнопок Старт и Новая игра
  btnStart.addEventListener('click', startGame)
  btnRenew.addEventListener('click', refreshGame)

  // Отслеживание клавиш клавиатуры
  addEventListener('keydown', changeDirection)
  document.getElementById('snake-field').addEventListener('touchstart', changeDirectionTouch)
}

// Функция генерации игрового поля
function prepareGameField() {
  // Создаём таблицу
  let game_table = document.createElement('table')
  game_table.setAttribute('class', 'game-table')

  // Генерация ячеек игровой таблицы
  for (let i = 0; i < FIELD_SIZE_Y; i++) {
    // Создание строки
    let row = document.createElement('tr')
    row.className = 'game-table-row row-' + i

    for (let j = 0; j < FIELD_SIZE_X; j++) {
      // Создание ячейки
      let cell = document.createElement('td')
      cell.className = 'game-table-cell cell-' + i + '-' + j
      row.appendChild(cell) // Добавление ячейки
    }
    game_table.appendChild(row) // Добавление строки
  }
  document.getElementById('snake-field').appendChild(game_table) // Добавление таблицы
}

// Старт игры
function startGame() {
  if (!gameIsRunning) {
    gameIsRunning = true
    btnStart.className = "snake-start-nonactive"
    createFood()
    respawn()
    snake_timer = setInterval(move, SNAKE_SPEED)
    food_timer = setInterval(createFood, FOOD_SPEED)
    problem_timer = setInterval(createProblem, PROBLEM_SPEED)
  }
}

// Функция расположения змейки на игровом поле
function respawn() {
  // Змейка - массив td
  // Стартовая длина змейки = 2
  // Respawn змейки из центра
  let start_coord_x = Math.floor(FIELD_SIZE_X / 2)
  let start_coord_y = Math.floor(FIELD_SIZE_Y / 2)

  // Голова змейки
  let snake_head = document.getElementsByClassName('cell-' + start_coord_y + '-' + start_coord_x)[0]
  snake_head.setAttribute('class', snake_head.getAttribute('class') + ' snake-unit')
  // Тело змейки
  let snake_tail = document.getElementsByClassName('cell-' + (start_coord_y - 1) + '-' + start_coord_x)[0]
  snake_tail.setAttribute('class', snake_tail.getAttribute('class') + ' snake-unit')

  snake.push(snake_head)
  snake.push(snake_tail)
  points.innerHTML = score
}

// Движение змейки
function move() {
  // Сборка классов
  let snake_head_classes = snake[snake.length - 1].getAttribute('class').split(' ')

  // Сдвиг головы
  let new_unit
  let snake_coords = snake_head_classes[1].split('-')
  let coord_y = parseInt(snake_coords[1])
  let coord_x = parseInt(snake_coords[2])

  // Определяем новую точку
  if (direction == 'x-') new_unit = document.getElementsByClassName('cell-' + (coord_y) + '-' + (coord_x - 1))[0]
  else if (direction == 'x+') new_unit = document.getElementsByClassName('cell-' + (coord_y) + '-' + (coord_x + 1))[0]
  else if (direction == 'y+') new_unit = document.getElementsByClassName('cell-' + (coord_y - 1) + '-' + (coord_x))[0]
  else if (direction == 'y-') new_unit = document.getElementsByClassName('cell-' + (coord_y + 1) + '-' + (coord_x))[0]

  if (new_unit === undefined) new_unit = headTeleport(coord_y, coord_x)
  if (!haveFood(new_unit)) {
    // Находим хвост
    let removed = snake.splice(0, 1)[0]
    let classes = removed.getAttribute('class').split(' ')

    // удаляем хвост
    removed.setAttribute('class', classes[0] + ' ' + classes[1])
  } else {
    if (SNAKE_SPEED > 50) {
      SNAKE_SPEED -= 20
      clearInterval(snake_timer)
      snake_timer = setInterval(move, SNAKE_SPEED)
    }
  }

  // Проверки:
  // 1) new_unit не часть змейки
  // 2) не врезались в препятствие
  if (!isSnakeUnit(new_unit) && pathClear(new_unit)) {
    // Добавление новой части змейки
    new_unit.setAttribute('class', new_unit.getAttribute('class') + ' snake-unit')
    snake.push(new_unit)

    // Проверяем, надо ли убрать хвост
  } else finishTheGame()
}


// Функция переноса змейки на другую сторону
// @param coord_y
// @param coord_x
// @returns {*}
function headTeleport(coord_y, coord_x) {
  let unit
  if (direction == 'x-') unit = document.getElementsByClassName('cell-' + (coord_y) + '-' + (FIELD_SIZE_X - 1))[0]
  else if (direction == 'x+') unit = document.getElementsByClassName('cell-' + (coord_y) + '-' + (0))[0]
  else if (direction == 'y+') unit = document.getElementsByClassName('cell-' + (FIELD_SIZE_Y - 1) + '-' + (coord_x))[0]
  else if (direction == 'y-') unit = document.getElementsByClassName('cell-' + (0) + '-' + (coord_x))[0]
  return unit
}


// Функция проверки, не врезались ли мы в преграду
// @param unit
function pathClear(unit) {
  let check = false

  let unit_classes = unit.getAttribute('class').split(' ')
  if (!unit_classes.includes('problem-unit')) check = true
  return check
}


// Проверка на змейку
// @param unit
// @returns {boolean}
function isSnakeUnit(unit) {
  let check = false
  if (snake.includes(unit)) check = true
  return check
}

// проверка на еду
// @param unit
// @returns {boolean}
function haveFood(unit) {
  let check = false
  let unit_classes = unit.getAttribute('class').split(' ')

  // Если еда
  if (unit_classes.includes('food-unit')) {
    check = true
    createFood()
    score++
    points.innerHTML = score
  }
  return check
}


// Создание еды
function createFood() {
  let foodCreated = false
  while (!foodCreated) {
    // рандом
    let food_x = Math.floor(Math.random() * FIELD_SIZE_X)
    let food_y = Math.floor(Math.random() * FIELD_SIZE_Y)
    let food_cell = document.getElementsByClassName('cell-' + food_y + '-' + food_x)[0]
    let food_cell_classes = food_cell.getAttribute('class').split(' ')

    // проверка на змейку
    if (!food_cell_classes.includes('snake-unit') && !food_cell_classes.includes('problem-unit')) {
      let classes = ''
      for (let i = 0; i < food_cell_classes.length; i++) {
        classes += food_cell_classes[i] + ' '
      }
      food_cell.setAttribute('class', classes + 'food-unit')
      foodCreated = true
    }
  }
}


//Функция созданяи препятствий-проблем для нашей змейки
function createProblem() {
  let problemCreated = false
  while (!problemCreated) {
    // рандом
    let problem_x = Math.floor(Math.random() * FIELD_SIZE_X)
    let problem_y = Math.floor(Math.random() * FIELD_SIZE_Y)
    let problem_cell = document.getElementsByClassName('cell-' + problem_y + '-' + problem_x)[0]
    let problem_cell_classes = problem_cell.getAttribute('class').split(' ')

    // проверка на змейку
    if (!problem_cell_classes.includes('snake-unit') && !problem_cell_classes.includes('food-unit')) {
      let classes = ''
      for (let i = 0; i < problem_cell_classes.length; i++) {
        classes += problem_cell_classes[i] + ' '
      }
      problem_cell.setAttribute('class', classes + 'problem-unit')
      problemCreated = true
    }
  }
}


// Изменение направления движения змейки
// @param d - событие
//
function changeDirectionTouch(d) {
  x = touch.pageX
  y = touch.pageY
}

function changeDirection(e) {
  switch (e.keyCode) {
    case 37: // Клавиша влево
      if (direction != 'x+') direction = 'x-'
      break
    case 38: // Клавиша вверх
      if (direction != 'y-') direction = 'y+'
      break
    case 39: // Клавиша вправо
      if (direction != 'x-') direction = 'x+'
      break
    case 40: // Клавиша вниз
      if (direction != 'y+') direction = 'y-'
      break
  }
}


// Функция завершения игры
function finishTheGame() {
  gameIsRunning = false
  clearInterval(snake_timer)
  clearInterval(food_timer)
  clearInterval(problem_timer)
  alert('Вы проиграли! Ваш результат: ' + score.toString())
}


// Новая игра
function refreshGame() {
  location.reload()
}

// Инициализация
window.onload = init