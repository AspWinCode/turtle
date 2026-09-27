import * as Blockly from 'blockly/core';
import { pythonGenerator, Order } from 'blockly/python';
import 'blockly/blocks';

/** Свои блоки черепашки — генерируют настоящий Python (модуль turtle),
 * который затем выполняется Skulpt'ом (см. skulptRunner.ts). Полный набор
 * функций turtle доступен и без блоков — в код-режиме можно написать любой
 * метод модуля вручную; блоки покрывают самые частые команды. */

const TURTLE_COLOUR = 120;

Blockly.Blocks['turtle_forward'] = {
  init() {
    this.appendValueInput('DIST').setCheck('Number').appendField('вперёд на');
    this.appendDummyInput().appendField('шагов');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(TURTLE_COLOUR);
  },
};
pythonGenerator.forBlock['turtle_forward'] = (block) => {
  const dist = pythonGenerator.valueToCode(block, 'DIST', Order.NONE) || '0';
  return `turtle.forward(${dist})\n`;
};

Blockly.Blocks['turtle_backward'] = {
  init() {
    this.appendValueInput('DIST').setCheck('Number').appendField('назад на');
    this.appendDummyInput().appendField('шагов');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(TURTLE_COLOUR);
  },
};
pythonGenerator.forBlock['turtle_backward'] = (block) => {
  const dist = pythonGenerator.valueToCode(block, 'DIST', Order.NONE) || '0';
  return `turtle.backward(${dist})\n`;
};

Blockly.Blocks['turtle_right'] = {
  init() {
    this.appendValueInput('DEG').setCheck('Number').appendField('повернуть направо на');
    this.appendDummyInput().appendField('градусов');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(TURTLE_COLOUR);
  },
};
pythonGenerator.forBlock['turtle_right'] = (block) => {
  const deg = pythonGenerator.valueToCode(block, 'DEG', Order.NONE) || '0';
  return `turtle.right(${deg})\n`;
};

Blockly.Blocks['turtle_left'] = {
  init() {
    this.appendValueInput('DEG').setCheck('Number').appendField('повернуть налево на');
    this.appendDummyInput().appendField('градусов');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(TURTLE_COLOUR);
  },
};
pythonGenerator.forBlock['turtle_left'] = (block) => {
  const deg = pythonGenerator.valueToCode(block, 'DEG', Order.NONE) || '0';
  return `turtle.left(${deg})\n`;
};

Blockly.Blocks['turtle_pen'] = {
  init() {
    this.appendDummyInput().appendField('перо').appendField(
      new Blockly.FieldDropdown([
        ['опустить (рисовать)', 'DOWN'],
        ['поднять (не рисовать)', 'UP'],
      ]),
      'STATE',
    );
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(TURTLE_COLOUR);
  },
};
pythonGenerator.forBlock['turtle_pen'] = (block) => {
  const state = block.getFieldValue('STATE');
  return state === 'UP' ? 'turtle.penup()\n' : 'turtle.pendown()\n';
};

Blockly.Blocks['turtle_color'] = {
  init() {
    this.appendValueInput('COLOR').setCheck('Colour').appendField('цвет линии');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(TURTLE_COLOUR);
  },
};
pythonGenerator.forBlock['turtle_color'] = (block) => {
  const color = pythonGenerator.valueToCode(block, 'COLOR', Order.NONE) || "'#000000'";
  return `turtle.pencolor(${color})\n`;
};

Blockly.Blocks['turtle_fillcolor'] = {
  init() {
    this.appendValueInput('COLOR').setCheck('Colour').appendField('цвет заливки');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(TURTLE_COLOUR);
  },
};
pythonGenerator.forBlock['turtle_fillcolor'] = (block) => {
  const color = pythonGenerator.valueToCode(block, 'COLOR', Order.NONE) || "'#000000'";
  return `turtle.fillcolor(${color})\n`;
};

Blockly.Blocks['turtle_fill'] = {
  init() {
    this.appendStatementInput('DO').appendField('закрасить фигуру');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(TURTLE_COLOUR);
    this.setTooltip('Всё внутри блока обводится, а затем заливается текущим цветом заливки.');
  },
};
pythonGenerator.forBlock['turtle_fill'] = (block) => {
  const inner = pythonGenerator.statementToCode(block, 'DO');
  return `turtle.begin_fill()\n${inner}turtle.end_fill()\n`;
};

Blockly.Blocks['turtle_width'] = {
  init() {
    this.appendValueInput('WIDTH').setCheck('Number').appendField('толщина линии');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(TURTLE_COLOUR);
  },
};
pythonGenerator.forBlock['turtle_width'] = (block) => {
  const width = pythonGenerator.valueToCode(block, 'WIDTH', Order.NONE) || '1';
  return `turtle.pensize(${width})\n`;
};

Blockly.Blocks['turtle_goto'] = {
  init() {
    this.appendValueInput('X').setCheck('Number').appendField('перейти в точку x:');
    this.appendValueInput('Y').setCheck('Number').appendField('y:');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(TURTLE_COLOUR);
  },
};
pythonGenerator.forBlock['turtle_goto'] = (block) => {
  const x = pythonGenerator.valueToCode(block, 'X', Order.NONE) || '0';
  const y = pythonGenerator.valueToCode(block, 'Y', Order.NONE) || '0';
  return `turtle.goto(${x}, ${y})\n`;
};

Blockly.Blocks['turtle_home'] = {
  init() {
    this.appendDummyInput().appendField('вернуться в центр');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(TURTLE_COLOUR);
  },
};
pythonGenerator.forBlock['turtle_home'] = () => 'turtle.home()\n';

Blockly.Blocks['turtle_clear'] = {
  init() {
    this.appendDummyInput().appendField('стереть рисунок');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(TURTLE_COLOUR);
  },
};
pythonGenerator.forBlock['turtle_clear'] = () => 'turtle.clear()\n';

Blockly.Blocks['turtle_circle'] = {
  init() {
    this.appendValueInput('RADIUS').setCheck('Number').appendField('нарисовать круг радиусом');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(TURTLE_COLOUR);
  },
};
pythonGenerator.forBlock['turtle_circle'] = (block) => {
  const radius = pythonGenerator.valueToCode(block, 'RADIUS', Order.NONE) || '50';
  return `turtle.circle(${radius})\n`;
};

Blockly.Blocks['turtle_dot'] = {
  init() {
    this.appendValueInput('SIZE').setCheck('Number').appendField('поставить точку размером');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(TURTLE_COLOUR);
  },
};
pythonGenerator.forBlock['turtle_dot'] = (block) => {
  const size = pythonGenerator.valueToCode(block, 'SIZE', Order.NONE) || '10';
  return `turtle.dot(${size})\n`;
};

Blockly.Blocks['turtle_write'] = {
  init() {
    this.appendValueInput('TEXT').setCheck('String').appendField('написать текст');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(TURTLE_COLOUR);
  },
};
pythonGenerator.forBlock['turtle_write'] = (block) => {
  const text = pythonGenerator.valueToCode(block, 'TEXT', Order.NONE) || "''";
  return `turtle.write(${text})\n`;
};

Blockly.Blocks['turtle_speed'] = {
  init() {
    this.appendValueInput('SPEED').setCheck('Number').appendField('скорость черепашки (1..10, 0 — без анимации)');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(TURTLE_COLOUR);
  },
};
pythonGenerator.forBlock['turtle_speed'] = (block) => {
  const speed = pythonGenerator.valueToCode(block, 'SPEED', Order.NONE) || '6';
  return `turtle.speed(${speed})\n`;
};

Blockly.Blocks['turtle_visible'] = {
  init() {
    this.appendDummyInput().appendField(
      new Blockly.FieldDropdown([
        ['показать черепашку', 'SHOW'],
        ['спрятать черепашку', 'HIDE'],
      ]),
      'STATE',
    );
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(TURTLE_COLOUR);
  },
};
pythonGenerator.forBlock['turtle_visible'] = (block) => {
  const state = block.getFieldValue('STATE');
  return state === 'HIDE' ? 'turtle.hideturtle()\n' : 'turtle.showturtle()\n';
};

Blockly.Blocks['turtle_bgcolor'] = {
  init() {
    this.appendValueInput('COLOR').setCheck('Colour').appendField('цвет фона');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(TURTLE_COLOUR);
  },
};
pythonGenerator.forBlock['turtle_bgcolor'] = (block) => {
  const color = pythonGenerator.valueToCode(block, 'COLOR', Order.NONE) || "'#ffffff'";
  return `turtle.bgcolor(${color})\n`;
};

export const TURTLE_TOOLBOX = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Черепашка',
      colour: TURTLE_COLOUR,
      contents: [
        { kind: 'block', type: 'turtle_forward', inputs: { DIST: { shadow: { type: 'math_number', fields: { NUM: 50 } } } } },
        { kind: 'block', type: 'turtle_backward', inputs: { DIST: { shadow: { type: 'math_number', fields: { NUM: 50 } } } } },
        { kind: 'block', type: 'turtle_right', inputs: { DEG: { shadow: { type: 'math_number', fields: { NUM: 90 } } } } },
        { kind: 'block', type: 'turtle_left', inputs: { DEG: { shadow: { type: 'math_number', fields: { NUM: 90 } } } } },
        { kind: 'block', type: 'turtle_goto' },
        { kind: 'block', type: 'turtle_home' },
        { kind: 'block', type: 'turtle_circle', inputs: { RADIUS: { shadow: { type: 'math_number', fields: { NUM: 50 } } } } },
        { kind: 'block', type: 'turtle_dot', inputs: { SIZE: { shadow: { type: 'math_number', fields: { NUM: 10 } } } } },
      ],
    },
    {
      kind: 'category',
      name: 'Перо и цвет',
      colour: TURTLE_COLOUR,
      contents: [
        { kind: 'block', type: 'turtle_pen' },
        { kind: 'block', type: 'turtle_color', inputs: { COLOR: { shadow: { type: 'colour_picker', fields: { COLOUR: '#1a7f37' } } } } },
        { kind: 'block', type: 'turtle_fillcolor', inputs: { COLOR: { shadow: { type: 'colour_picker', fields: { COLOUR: '#ffd43b' } } } } },
        { kind: 'block', type: 'turtle_fill' },
        { kind: 'block', type: 'turtle_width', inputs: { WIDTH: { shadow: { type: 'math_number', fields: { NUM: 2 } } } } },
        { kind: 'block', type: 'turtle_bgcolor', inputs: { COLOR: { shadow: { type: 'colour_picker', fields: { COLOUR: '#ffffff' } } } } },
      ],
    },
    {
      kind: 'category',
      name: 'Прочее',
      colour: TURTLE_COLOUR,
      contents: [
        { kind: 'block', type: 'turtle_write', inputs: { TEXT: { shadow: { type: 'text', fields: { TEXT: 'Привет!' } } } } },
        { kind: 'block', type: 'turtle_speed', inputs: { SPEED: { shadow: { type: 'math_number', fields: { NUM: 6 } } } } },
        { kind: 'block', type: 'turtle_visible' },
        { kind: 'block', type: 'turtle_clear' },
      ],
    },
    {
      kind: 'category',
      name: 'Повторение',
      colour: 210,
      contents: [
        { kind: 'block', type: 'controls_repeat_ext', inputs: { TIMES: { shadow: { type: 'math_number', fields: { NUM: 4 } } } } },
        { kind: 'block', type: 'controls_whileUntil' },
      ],
    },
    {
      kind: 'category',
      name: 'Логика',
      colour: 210,
      contents: [
        { kind: 'block', type: 'controls_if' },
        { kind: 'block', type: 'logic_compare' },
        { kind: 'block', type: 'logic_operation' },
        { kind: 'block', type: 'logic_boolean' },
      ],
    },
    {
      kind: 'category',
      name: 'Числа и текст',
      colour: 230,
      contents: [
        { kind: 'block', type: 'math_number' },
        { kind: 'block', type: 'math_arithmetic' },
        { kind: 'block', type: 'math_random_int' },
        { kind: 'block', type: 'text' },
      ],
    },
    {
      kind: 'category',
      name: 'Переменные',
      colour: 260,
      custom: 'VARIABLE',
    },
  ],
};

export { Blockly, pythonGenerator };
