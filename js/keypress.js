// Generated by CoffeeScript 1.3.3

/*
Copyright 2012 David Mauro

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Keypress is a robust keyboard input capturing Javascript utility
focused on input for games.

version 1.0.0
*/


/*
Options available and defaults:
    keys            : []            - An array of the keys pressed together to activate combo
    count           : 0             - The number of times a counting combo has been pressed. Reset on release.
    allow_default   : false         - Allow the default key event to happen in addition to the combo.
    is_ordered      : false         - Unless this is set to true, the keys can be pressed down in any order
    is_counting     : false         - Makes this a counting combo (see documentation)
    is_sequence     : false         - Rather than a key combo, this is an ordered key sequence
    prevent_repeat  : false         - Prevent the combo from repeating when keydown is held.
    on_keyup        : null          - A function that is called when the combo is released
    on_keydown      : null          - A function that is called when the combo is pressed.
    on_release      : null          - A function that is called for counting combos when all keys are released.
    this            : undefined     - The scope for this of your callback functions
*/


(function() {
  var key, _, _active_combos, _add_key_to_sequence, _add_to_active_combos, _allow_key_repeat, _bug_catcher, _change_keycodes_by_browser, _cmd_bug_check, _combo_defaults, _compare_arrays, _convert_key_to_readable, _convert_to_shifted_key, _decide_meta_key, _event_classname, _fire, _get_active_combo, _get_possible_sequences, _get_potential_combos, _get_sequence, _key_down, _key_up, _keycode_alternate_names, _keycode_dictionary, _keycode_shifted_keys, _keys_down, _keys_remain, _log_error, _match_combo_arrays, _metakey, _modifier_event_mapping, _modifier_keys, _prevent_capture, _prevent_default, _ready, _receive_input, _registered_combos, _remove_from_active_combos, _sequence, _sequence_timer, _unregister_combo, _valid_keys, _validate_combo,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __hasProp = {}.hasOwnProperty;

  _ready = false;

  _registered_combos = [];

  _sequence = [];

  _sequence_timer = null;

  window.keys_down = _keys_down = [];

  window.active_combos = _active_combos = [];

  _prevent_capture = false;

  _event_classname = "keypress_events";

  _metakey = "ctrl";

  _modifier_keys = ["meta", "alt", "option", "ctrl", "shift", "cmd"];

  _valid_keys = [];

  _combo_defaults = {
    keys: [],
    count: 0
  };

  _log_error = function() {
    return console.log.apply(console, arguments);
  };

  _compare_arrays = function(a1, a2) {
    var item, _i, _j, _len, _len1;
    if (a1.length !== a2.length) {
      return false;
    }
    for (_i = 0, _len = a1.length; _i < _len; _i++) {
      item = a1[_i];
      if (__indexOf.call(a2, item) >= 0) {
        continue;
      }
      return false;
    }
    for (_j = 0, _len1 = a2.length; _j < _len1; _j++) {
      item = a2[_j];
      if (__indexOf.call(a1, item) >= 0) {
        continue;
      }
      return false;
    }
    return true;
  };

  _prevent_default = function(e) {
    return e.preventDefault();
  };

  _allow_key_repeat = function(combo) {
    if (combo.prevent_repeat) {
      return false;
    }
    if (typeof combo.on_keydown === "function") {
      return true;
    }
  };

  _keys_remain = function(combo) {
    var key, keys_remain, _i, _len, _ref;
    _ref = combo.keys;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      key = _ref[_i];
      if (__indexOf.call(_keys_down, key) >= 0) {
        keys_remain = true;
        break;
      }
    }
    return keys_remain;
  };

  _fire = function(event, combo, key_event) {
    if (typeof combo["on_" + event] === "function") {
      if (event === "release") {
        if (combo["on_" + event].call(combo["this"], key_event, combo.count) === false) {
          _prevent_default(key_event);
        }
        combo.count = 0;
      } else {
        if (combo["on_" + event].call(combo["this"], key_event) === false) {
          _prevent_default(key_event);
        }
      }
    }
    if (event === "keyup") {
      return combo.keyup_fired = true;
    }
  };

  _match_combo_arrays = function(potential_match, source_combo_array, allow_partial_match) {
    var source_combo, _i, _len;
    if (allow_partial_match == null) {
      allow_partial_match = false;
    }
    for (_i = 0, _len = source_combo_array.length; _i < _len; _i++) {
      source_combo = source_combo_array[_i];
      if (source_combo_array.is_sequence) {
        continue;
      }
      if (source_combo.is_ordered) {
        if (potential_match.join("") === source_combo.keys.join("")) {
          return source_combo;
        }
        if (allow_partial_match && potential_match.join("") === source_combo.keys.slice(0, potential_match.length).join("")) {
          return source_combo;
        }
      } else {
        if (_compare_arrays(potential_match, source_combo.keys)) {
          return source_combo;
        }
        if (allow_partial_match && _compare_arrays(potential_match, source_combo.keys.slice(0, potential_match.length))) {
          return source_combo;
        }
      }
    }
    return false;
  };

  _cmd_bug_check = function(combo_keys) {
    if (__indexOf.call(_keys_down, "cmd") >= 0 && __indexOf.call(combo_keys, "cmd") < 0) {
      return false;
    }
    return true;
  };

  _get_active_combo = function(key) {
    var better_pots, check_for_conflict, keys_down, perfect_match, potential, potentials, slice_up_array, _i, _len;
    keys_down = _keys_down.filter(function(down_key) {
      return down_key !== key;
    });
    keys_down.push(key);
    perfect_match = _match_combo_arrays(keys_down, _registered_combos);
    if (perfect_match && _cmd_bug_check(keys_down)) {
      return perfect_match;
    }
    potentials = [];
    slice_up_array = function(array) {
      var fuzzy_match, i, partial, _i, _ref;
      for (i = _i = 0, _ref = array.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        partial = array.slice();
        partial.splice(i, 1);
        if (!partial.length) {
          continue;
        }
        fuzzy_match = _match_combo_arrays(partial, _registered_combos);
        if (fuzzy_match && __indexOf.call(potentials, fuzzy_match) < 0) {
          potentials.push(fuzzy_match);
        }
        slice_up_array(partial);
      }
    };
    slice_up_array(keys_down);
    if (!potentials.length) {
      return false;
    }
    check_for_conflict = function(array) {
      if (array.length > 1 && array[0].keys.length === array[1].keys.length) {
        _log_error("Conflicting combos registered");
        return true;
      }
    };
    if (potentials.length > 1) {
      potentials.sort(function(a, b) {
        return b.keys.length - a.keys.length;
      });
      better_pots = [];
      for (_i = 0, _len = potentials.length; _i < _len; _i++) {
        potential = potentials[_i];
        if (__indexOf.call(potential.keys, key) >= 0) {
          better_pots.push(potential);
        }
      }
      if (better_pots.length) {
        if (check_for_conflict(better_pots)) {
          return false;
        }
        potentials = better_pots;
      } else {
        if (check_for_conflict(potentials)) {
          return false;
        }
      }
    }
    if (!potentials.length) {
      return false;
    }
    if (_cmd_bug_check(potentials[0].keys)) {
      return potentials[0];
    }
  };

  _get_potential_combos = function(key) {
    var combo, potentials, _i, _len;
    potentials = [];
    for (_i = 0, _len = _registered_combos.length; _i < _len; _i++) {
      combo = _registered_combos[_i];
      if (combo.is_sequence) {
        continue;
      }
      if (__indexOf.call(combo.keys, key) >= 0 && _cmd_bug_check(combo.keys)) {
        potentials.push(combo);
      }
    }
    return potentials;
  };

  _add_to_active_combos = function(combo) {
    var active_key, active_keys, i, is_match, replaced, _i, _j, _len, _ref;
    replaced = false;
    if (__indexOf.call(_active_combos, combo) >= 0) {
      return false;
    } else if (_active_combos.length) {
      for (i = _i = 0, _ref = _active_combos.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        active_keys = _active_combos[i].keys.slice();
        for (_j = 0, _len = active_keys.length; _j < _len; _j++) {
          active_key = active_keys[_j];
          is_match = true;
          if (__indexOf.call(combo.keys, active_key) < 0) {
            is_match = false;
            break;
          }
        }
        if (is_match) {
          _active_combos.splice(i, 1, combo);
          replaced = true;
          break;
        }
      }
    }
    if (!replaced) {
      _active_combos.unshift(combo);
    }
    return true;
  };

  _remove_from_active_combos = function(combo) {
    var active_combo, i, _i, _ref;
    for (i = _i = 0, _ref = _active_combos.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      active_combo = _active_combos[i];
      if (active_combo === combo) {
        _active_combos.splice(i, 1);
        break;
      }
    }
  };

  _add_key_to_sequence = function(key, e) {
    var combo, sequence_combos, _i, _len;
    _sequence.push(key);
    sequence_combos = _get_possible_sequences();
    if (sequence_combos.length) {
      for (_i = 0, _len = sequence_combos.length; _i < _len; _i++) {
        combo = sequence_combos[_i];
        if (!combo.allow_default) {
          _prevent_default(e);
        }
      }
      if (_sequence_timer) {
        clearTimeout(_sequence_timer);
      }
      _sequence_timer = setTimeout(function() {
        return _sequence = [];
      }, 800);
    } else {
      _sequence = [];
    }
  };

  _get_possible_sequences = function() {
    var combo, i, j, match, matches, sequence, _i, _j, _k, _len, _ref, _ref1;
    matches = [];
    for (_i = 0, _len = _registered_combos.length; _i < _len; _i++) {
      combo = _registered_combos[_i];
      for (j = _j = 1, _ref = _sequence.length; 1 <= _ref ? _j <= _ref : _j >= _ref; j = 1 <= _ref ? ++_j : --_j) {
        sequence = _sequence.slice(-j);
        if (!combo.is_sequence) {
          continue;
        }
        if (__indexOf.call(combo.keys, "shift") < 0) {
          sequence = sequence.filter(function(key) {
            return key !== "shift";
          });
          if (!sequence.length) {
            continue;
          }
        }
        for (i = _k = 0, _ref1 = sequence.length; 0 <= _ref1 ? _k < _ref1 : _k > _ref1; i = 0 <= _ref1 ? ++_k : --_k) {
          if (combo.keys[i] === sequence[i]) {
            match = true;
          } else {
            match = false;
            break;
          }
        }
        if (match) {
          matches.push(combo);
        }
      }
    }
    return matches;
  };

  _get_sequence = function(key) {
    var combo, i, j, match, seq_key, sequence, _i, _j, _k, _len, _ref, _ref1;
    for (_i = 0, _len = _registered_combos.length; _i < _len; _i++) {
      combo = _registered_combos[_i];
      if (!combo.is_sequence) {
        continue;
      }
      for (j = _j = 1, _ref = _sequence.length; 1 <= _ref ? _j <= _ref : _j >= _ref; j = 1 <= _ref ? ++_j : --_j) {
        sequence = _sequence.filter(function(seq_key) {
          if (__indexOf.call(combo.keys, "shift") >= 0) {
            return true;
          }
          return seq_key !== "shift";
        }).slice(-j);
        if (combo.keys.length !== sequence.length) {
          continue;
        }
        for (i = _k = 0, _ref1 = sequence.length; 0 <= _ref1 ? _k < _ref1 : _k > _ref1; i = 0 <= _ref1 ? ++_k : --_k) {
          seq_key = sequence[i];
          if (__indexOf.call(combo.keys, "shift") < 0 ? seq_key === "shift" : void 0) {
            continue;
          }
          if (key === "shift" && __indexOf.call(combo.keys, "shift") < 0) {
            continue;
          }
          if (combo.keys[i] === seq_key) {
            match = true;
          } else {
            match = false;
            break;
          }
        }
      }
      if (match) {
        return combo;
      }
    }
    return false;
  };

  _convert_to_shifted_key = function(key, e) {
    var k;
    if (!e.shiftKey) {
      return false;
    }
    k = _keycode_shifted_keys[key];
    if (k != null) {
      return k;
    }
    return false;
  };

  _key_down = function(key, e) {
    var combo, event_mod, mod, potential, potential_combos, sequence_combo, shifted_key, _i, _len;
    shifted_key = _convert_to_shifted_key(key, e);
    if (shifted_key) {
      key = shifted_key;
    }
    _add_key_to_sequence(key, e);
    sequence_combo = _get_sequence(key);
    if (sequence_combo) {
      _fire("keydown", sequence_combo, e);
    }
    for (mod in _modifier_event_mapping) {
      event_mod = _modifier_event_mapping[mod];
      if (!e[event_mod]) {
        continue;
      }
      if (mod === "meta") {
        mod = _metakey;
      }
      if (mod === key || __indexOf.call(_keys_down, mod) >= 0) {
        continue;
      }
      _keys_down.push(mod);
    }
    combo = _get_active_combo(key);
    if (combo && !combo.allow_default) {
      _prevent_default(e);
    }
    potential_combos = _get_potential_combos(key);
    if (potential_combos.length) {
      for (_i = 0, _len = potential_combos.length; _i < _len; _i++) {
        potential = potential_combos[_i];
        if (!potential.allow_default) {
          _prevent_default(e);
        }
      }
    }
    if (__indexOf.call(_keys_down, key) >= 0) {
      if (!_allow_key_repeat(combo)) {
        return false;
      }
    } else {
      _keys_down.push(key);
    }
    if (!combo) {
      return false;
    }
    _add_to_active_combos(combo, key);
    combo.keyup_fired = false;
    _fire("keydown", combo, e);
    if (combo.is_counting && typeof combo.on_keydown === "function") {
      combo.count += 1;
    }
  };

  _key_up = function(key, e) {
    var active_combo, active_combos_length, combo, i, keys_remaining, sequence_combo, shifted_key, unshifted_key, _i, _j, _k, _len, _len1, _ref, _ref1;
    unshifted_key = key;
    shifted_key = _convert_to_shifted_key(key, e);
    if (shifted_key) {
      key = shifted_key;
    }
    shifted_key = _keycode_shifted_keys[unshifted_key];
    if (e.shiftKey) {
      if (!(shifted_key && __indexOf.call(_keys_down, shifted_key) >= 0)) {
        key = unshifted_key;
      }
    } else {
      if (!(unshifted_key && __indexOf.call(_keys_down, unshifted_key) >= 0)) {
        key = shifted_key;
      }
    }
    sequence_combo = _get_sequence(key);
    if (sequence_combo) {
      _fire("keyup", sequence_combo, e);
    }
    if (__indexOf.call(_keys_down, key) < 0) {
      return false;
    }
    for (i = _i = 0, _ref = _keys_down.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      if ((_ref1 = _keys_down[i]) === key || _ref1 === shifted_key || _ref1 === unshifted_key) {
        _keys_down.splice(i, 1);
        break;
      }
    }
    for (_j = 0, _len = _active_combos.length; _j < _len; _j++) {
      active_combo = _active_combos[_j];
      if (__indexOf.call(active_combo.keys, key) >= 0) {
        combo = active_combo;
        break;
      }
    }
    if (!combo) {
      return;
    }
    keys_remaining = _keys_remain(combo);
    if (!combo.keyup_fired && (!combo.is_counting || (combo.is_counting && keys_remaining))) {
      _fire("keyup", combo, e);
      if (combo.is_counting && typeof combo.on_keyup === "function" && typeof combo.on_keydown !== "function") {
        combo.count += 1;
      }
    }
    active_combos_length = _active_combos.length;
    if (!keys_remaining) {
      if (combo.is_counting) {
        _fire("release", combo, e);
      }
      _remove_from_active_combos(combo);
    }
    if (active_combos_length > 1) {
      for (_k = 0, _len1 = _active_combos.length; _k < _len1; _k++) {
        active_combo = _active_combos[_k];
        if (combo === active_combo || active_combo === void 0) {
          continue;
        }
        if (!_keys_remain(active_combo)) {
          _remove_from_active_combos(active_combo);
        }
      }
    }
  };

  _receive_input = function(e, is_keydown) {
    var key;
    if (_prevent_capture) {
      if (_keys_down.length) {
        _keys_down = [];
      }
      return;
    }
    if (!is_keydown && !_keys_down.length) {
      return;
    }
    key = _convert_key_to_readable(e.keyCode);
    if (!key) {
      return;
    }
    if (is_keydown) {
      return _key_down(key, e);
    } else {
      return _key_up(key, e);
    }
  };

  _unregister_combo = function(combo) {
    var i, _i, _ref, _results;
    _results = [];
    for (i = _i = 0, _ref = _registered_combos.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      if (combo === _registered_combos[i]) {
        _registered_combos.splice(i, 1);
        break;
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  _validate_combo = function(combo) {
    var alt_name, i, key, mod_key, non_modifier_keys, registered_combo, _i, _j, _k, _l, _len, _len1, _len2, _ref, _ref1;
    for (i = _i = 0, _ref = combo.keys.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      key = combo.keys[i];
      alt_name = _keycode_alternate_names[key];
      if (alt_name) {
        key = combo.keys[i] = alt_name;
      }
      if (key === "meta" || key === "cmd") {
        combo.keys.splice(i, 1, _metakey);
        if (key === "cmd") {
          _log_error("Warning: use the \"meta\" key rather than \"cmd\" for Windows compatibility");
        }
      }
    }
    _ref1 = combo.keys;
    for (_j = 0, _len = _ref1.length; _j < _len; _j++) {
      key = _ref1[_j];
      if (__indexOf.call(_valid_keys, key) < 0) {
        _log_error("Do not recognize the key \"" + key + "\"");
        return false;
      }
    }
    for (_k = 0, _len1 = _registered_combos.length; _k < _len1; _k++) {
      registered_combo = _registered_combos[_k];
      if (_compare_arrays(combo.keys, registered_combo.keys)) {
        _log_error("Warning: we're overwriting another combo", combo.keys);
        _unregister_combo(registered_combo);
        break;
      }
    }
    if (__indexOf.call(combo.keys, "meta") >= 0 || __indexOf.call(combo.keys, "cmd") >= 0) {
      non_modifier_keys = combo.keys.slice();
      for (_l = 0, _len2 = _modifier_keys.length; _l < _len2; _l++) {
        mod_key = _modifier_keys[_l];
        if ((i = non_modifier_keys.indexOf(mod_key)) > -1) {
          non_modifier_keys.splice(i, 1);
        }
      }
      if (non_modifier_keys.length > 1) {
        _log_error("META and CMD key combos cannot have more than 1 non-modifier keys", combo, non_modifier_keys);
        return true;
      }
    }
    return true;
  };

  _decide_meta_key = function() {
    if (navigator.userAgent.indexOf("Mac OS X") !== -1) {
      _metakey = "cmd";
    }
  };

  _bug_catcher = function(e) {
    var _ref;
    if (__indexOf.call(_keys_down, "cmd") >= 0 && ((_ref = _convert_key_to_readable(e.keyCode)) !== "cmd" && _ref !== "shift" && _ref !== "alt")) {
      return _receive_input(e, false);
    }
  };

  _change_keycodes_by_browser = function() {
    if (navigator.userAgent.indexOf("Opera") !== -1) {
      _keycode_dictionary["17"] = "cmd";
    }
  };

  window.keypress = {};

  keypress.init = function() {
    if (_ready) {
      _registered_combos = [];
      return;
    }
    _decide_meta_key();
    _change_keycodes_by_browser();
    document.body.onkeydown = function(e) {
      _receive_input(e, true);
      return _bug_catcher(e);
    };
    document.body.onkeyup = function(e) {
      return _receive_input(e, false);
    };
    window.onblur = function() {
      var _valid_combos;
      _keys_down = [];
      return _valid_combos = [];
    };
    return _ready = true;
  };

  keypress.combo = function(keys, callback, allow_default) {
    if (allow_default == null) {
      allow_default = false;
    }
    return keypress.register_combo({
      keys: keys,
      on_keydown: callback,
      allow_default: allow_default
    });
  };

  keypress.keyup_combo = function(keys, callback, allow_default) {
    if (allow_default == null) {
      allow_default = false;
    }
    return keypress.register_combo({
      keys: keys,
      on_keyup: callback,
      allow_default: allow_default
    });
  };

  keypress.counting_combo = function(keys, count_callback, release_callback, allow_default) {
    if (allow_default == null) {
      allow_default = false;
    }
    return keypress.register_combo({
      keys: keys,
      is_counting: true,
      is_ordered: true,
      on_keydown: count_callback,
      on_release: release_callback,
      allow_default: allow_default
    });
  };

  keypress.sequence = function(keys, callback, allow_default) {
    if (allow_default == null) {
      allow_default = false;
    }
    return keypress.register_combo({
      keys: keys,
      on_keydown: callback,
      is_sequence: true,
      allow_default: allow_default
    });
  };

  keypress.register_combo = function(combo) {
    var property, value;
    if (typeof combo.keys === "string") {
      combo.keys = combo.keys.split(" ");
    }
    for (property in _combo_defaults) {
      if (!__hasProp.call(_combo_defaults, property)) continue;
      value = _combo_defaults[property];
      if (combo[property] == null) {
        combo[property] = value;
      }
    }
    if (_validate_combo(combo)) {
      _registered_combos.push(combo);
      return true;
    }
  };

  keypress.register_many = function(combo_array) {
    var combo, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = combo_array.length; _i < _len; _i++) {
      combo = combo_array[_i];
      _results.push(keypress.register_combo(combo));
    }
    return _results;
  };

  keypress.unregister_combo = function(keys) {
    var combo, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = _registered_combos.length; _i < _len; _i++) {
      combo = _registered_combos[_i];
      if (_compare_arrays(keys, combo.keys)) {
        _results.push(_unregister_combo(combo));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  keypress.unregister_many = function(combo_array) {
    var combo, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = combo_array.length; _i < _len; _i++) {
      combo = combo_array[_i];
      _results.push(keypress.unregister_combo(combo.keys));
    }
    return _results;
  };

  keypress.listen = function() {
    return _prevent_capture = false;
  };

  keypress.stop_listening = function() {
    return _prevent_capture = true;
  };

  _convert_key_to_readable = function(k) {
    return _keycode_dictionary[k];
  };

  _modifier_event_mapping = {
    "meta": "metaKey",
    "ctrl": "ctrlKey",
    "shift": "shiftKey",
    "alt": "altKey"
  };

  _keycode_alternate_names = {
    "control": "ctrl",
    "command": "cmd",
    "break": "pause",
    "windows": "cmd",
    "option": "alt",
    "caps_lock": "caps",
    "apostrophe": "\'",
    "semicolon": ";",
    "tilde": "~",
    "accent": "`"
  };

  _keycode_shifted_keys = {
    "/": "?",
    ".": ">",
    ",": "<",
    "\'": "\"",
    ";": ":",
    "[": "{",
    "]": "}",
    "\\": "|",
    "`": "~",
    "=": "+",
    "-": "_",
    "1": "!",
    "2": "@",
    "3": "#",
    "4": "$",
    "5": "%",
    "6": "^",
    "7": "&",
    "8": "*",
    "9": "(",
    "0": ")"
  };

  _keycode_dictionary = {
    0: "\\",
    8: "backspace",
    9: "tab",
    13: "enter",
    16: "shift",
    17: "ctrl",
    18: "alt",
    19: "pause",
    20: "caps",
    27: "escape",
    32: "space",
    33: "pageup",
    34: "pagedown",
    35: "end",
    36: "home",
    37: "left",
    38: "up",
    39: "right",
    40: "down",
    45: "insert",
    46: "delete",
    48: "0",
    49: "1",
    50: "2",
    51: "3",
    52: "4",
    53: "5",
    54: "6",
    55: "7",
    56: "8",
    57: "9",
    65: "a",
    66: "b",
    67: "c",
    68: "d",
    69: "e",
    70: "f",
    71: "g",
    72: "h",
    73: "i",
    74: "j",
    75: "k",
    76: "l",
    77: "m",
    78: "n",
    79: "o",
    80: "p",
    81: "q",
    82: "r",
    83: "s",
    84: "t",
    85: "u",
    86: "v",
    87: "w",
    88: "x",
    89: "y",
    90: "z",
    91: "cmd",
    92: "cmd",
    93: "cmd",
    106: "num_multiply",
    107: "num_add",
    108: "num_enter",
    109: "num_subtract",
    110: "num_decimal",
    111: "num_divide",
    186: ";",
    187: "=",
    188: ",",
    189: "-",
    190: ".",
    191: "/",
    192: "`",
    219: "[",
    220: "\\",
    221: "]",
    222: "\'",
    224: "cmd",
    57392: "ctrl"
  };

  for (_ in _keycode_dictionary) {
    key = _keycode_dictionary[_];
    _valid_keys.push(key);
  }

  for (_ in _keycode_shifted_keys) {
    key = _keycode_shifted_keys[_];
    _valid_keys.push(key);
  }

}).call(this);
