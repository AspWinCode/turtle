import * as Blockly from 'blockly/core';
import { javascriptGenerator, Order } from 'blockly/javascript';
import 'blockly/blocks';

/** Свои блоки черепашки — генерируют вызовы той же плоской JS-API
 * (turtleEngine.buildRuntimeApi), что и код, написанный руками в
 * код-режиме. Поэтому оба режима исполняются одним и тем же интерпретатором. */

const TURTLE_COLOUR = 120;

Blockly.Blocks['turtle_forward'] = {
  init() {
    this.appendValueInput('DIST').setCheck('Number').appendField('вперёд на');
    this.appendDummyInput().appendField('шагов');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(TURTLE_COLOUR);
    this.setTooltip('Двигает черепашку вперёд на указанное число шагов.');
  },
};
javascriptGenerator.forBlock['turtle_forward'] = (block) => {
  const dist = javascriptGenerator.valueToCode(block, 'DIST', Order.NONE) || '0';
  return `forward(${dist});\n`;
};

Blockly.Blocks['turtle_backward'] = {
  init() {
    this.appendValueInput('DIST').setCheck('Number').appendField('назад на');
    this.appendDummyInput().appendField('шагов');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(TURTLE_COLOUR);
    this.setTooltip('Двигает черепашку назад на указанное число шагов.');
  },
};
javascriptGenerator.forBlock['turtle_backward'] = (block) => {
  const dist = javascriptGenerator.valueToCode(block, 'DIST', Order.NONE) || '0';
  return `backward(${dist});\n`;
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
javascriptGenerator.forBlock['turtle_right'] = (block) => {
  const deg = javascriptGenerator.valueToCode(block, 'DEG', Order.NONE) || '0';
  return `right(${deg});\n`;
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
javascriptGenerator.forBlock['turtle_left'] = (block) => {
  const deg = javascriptGenerator.valueToCode(block, 'DEG', Order.NONE) || '0';
  return `left(${deg});\n`;
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
javascriptGenerator.forBlock['turtle_pen'] = (block) => {
  const state = block.getFieldValue('STATE');
  return state === 'UP' ? 'penUp();\n' : 'penDown();\n';
};

Blockly.Blocks['turtle_color'] = {
  init() {
    this.appendValueInput('COLOR').setCheck('Colour').appendField('цвет линии');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(TURTLE_COLOUR);
  },
};
javascriptGenerator.forBlock['turtle_color'] = (block) => {
  const color = javascriptGenerator.valueToCode(block, 'COLOR', Order.NONE) || "'#000000'";
  return `setColor(${color});\n`;
};

Blockly.Blocks['turtle_width'] = {
  init() {
    this.appendValueInput('WIDTH').setCheck('Number').appendField('толщина линии');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(TURTLE_COLOUR);
  },
};
javascriptGenerator.forBlock['turtle_width'] = (block) => {
  const width = javascriptGenerator.valueToCode(block, 'WIDTH', Order.NONE) || '1';
  return `setWidth(${width});\n`;
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
javascriptGenerator.forBlock['turtle_goto'] = (block) => {
  const x = javascriptGenerator.valueToCode(block, 'X', Order.NONE) || '0';
  const y = javascriptGenerator.valueToCode(block, 'Y', Order.NONE) || '0';
  return `goto(${x}, ${y});\n`;
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
        { kind: 'block', type: 'turtle_pen' },
        { kind: 'block', type: 'turtle_color', inputs: { COLOR: { shadow: { type: 'colour_picker', fields: { COLOUR: '#1a7f37' } } } } },
        { kind: 'block', type: 'turtle_width', inputs: { WIDTH: { shadow: { type: 'math_number', fields: { NUM: 2 } } } } },
        { kind: 'block', type: 'turtle_goto' },
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
      name: 'Числа',
      colour: 230,
      contents: [
        { kind: 'block', type: 'math_number' },
        { kind: 'block', type: 'math_arithmetic' },
        { kind: 'block', type: 'math_random_int' },
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

export { Blockly, javascriptGenerator };
