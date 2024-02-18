/**
 * multi.js
 * A user-friendly replacement for select boxes with multiple attribute enabled.
 *
 * Author: Fabian Lindfors
 * License: MIT
 */
var multi = (function() {
  var disabled_limit = false; // This will prevent to reset the "disabled" because of the limit at every click

  // Helper function to trigger an event on an element
  var trigger_event = function(type, el) {
    var e = document.createEvent("HTMLEvents");
    e.initEvent(type, false, true);
    el.dispatchEvent(e);
  };

   // Check if there is a limit and if is reached
   var check_limit = function (select, settings) {
    var limit = settings.limit;
    if (limit > -1) {
      // Count current selected
      var selected_count = 0;
      for (var i = 0; i < select.options.length; i++) {
        if (select.options[i].selected) {
          selected_count++;
        }
      }

      // Reached the limit
      if (selected_count === limit) {
        this.disabled_limit = true;

        // Trigger the function (if there is)
        if (typeof settings.limit_reached === "function") {
          settings.limit_reached();
        }

        // Disable all non-selected option
        for (var i = 0; i < select.options.length; i++) {
          var opt = select.options[i];

          if (!opt.selected) {
            opt.setAttribute("disabled", true);
          }
        }
      } else if (this.disabled_limit) {
        // Enable options (only if they weren't disabled on init)
        for (var i = 0; i < select.options.length; i++) {
          var opt = select.options[i];

          if (opt.getAttribute("data-origin-disabled") === "false") {
            opt.removeAttribute("disabled");
          }
        }

        this.disabled_limit = false;
      }
    }
  };

  // Toggles the target option on the select
  var toggle_option = function(select, multi_index, settings) {
    var option = select.options[multi_index];

    if (option.disabled) {
      return;
    }

    option.selected = !option.selected;

    check_limit(select, settings);

    trigger_event("change", select);

    // read back and remember sort order:
    var selected_order = scan_selected_order(select, settings);
    write_selected_order(select, settings, selected_order);
  };

  // Removes visual hilighting from all items of a given list
  function unhilight_list(select, list) {
    var items = list.querySelectorAll(".item");
    if (items) {
      for (var i = 0; i < items.length; i++) {
        items[i].classList.remove('hilight');
      }
    }
  }

  // Toggles hilight state of an option
  var toggle_option_hilight = function(select, event, settings) {
    var multi_index = event.target.getAttribute("multi-index");
    var option = select.options[multi_index];
    //console.log("toggle_option_hilight");
    if (option.disabled) {
      return;
    }

    select.setAttribute('data-multi-hilight', ""+multi_index);
    unhilight_list(select, select.wrapper.lists.selected);
    unhilight_list(select, select.wrapper.lists.non_selected);
    //console.log("toggle_option_hilight multi_index="+multi_index);
    event.target.className += " hilight";
  };

  // moves an option item up in selected panel
  var move_up = function(select, event, settings) {
    var items = select.wrapper.lists.selected.querySelectorAll(".item");
    //console.log("move_up: items "+items.length);
    for (var i = 1; i < items.length; i++) {
      var child = items[i];
      //console.log("move_up: test child "+i);
      if (child.classList.contains("hilight")) {
        //console.log("move_up: moving child "+i);
        select.wrapper.lists.selected.insertBefore(child, items[i-1]); // move one sibling up
      }
    }

    // read back and remember sort order:
    var selected_order = scan_selected_order(select, settings);
    write_selected_order(select, settings, selected_order);
  }

  // moves an option item down in selected panel
  var move_down = function(select, event, settings) {
    var items = select.wrapper.lists.selected.querySelectorAll(".item");
    //console.log("move_down: items "+items.length);
    for (var i = 0; i < items.length-1; i++) {
      var child = items[i];
      //console.log("move_down: test child "+i);
      if (child.classList.contains("hilight")) {
        //console.log("move_down: moving child "+i);
        select.wrapper.lists.selected.insertBefore(child, items[i+1].nextSibling); // move one sibling down
      }
    }

    // read back and remember sort order:
    var selected_order = scan_selected_order(select, settings);
    write_selected_order(select, settings, selected_order);
  }

  // scan order of selected items from DOM and return as array of data-value attributes
  var scan_selected_order = function(select, settings) {
    var items = select.wrapper.lists.selected.querySelectorAll(".item");
    //console.log("read_selected_order: items "+items.length);
    var order = [];
    for (var i = 0; i < items.length; i++) {
      order.push(items[i].getAttribute("data-value"));
    }
    return order;
  }

  // read sort array from SELECT element
  var read_selected_order = function(select, settings) {
    try {
      return JSON.parse(select.getAttribute("data-selected-order"));
    } catch(e) {
      return [];
    }
  }

  // write sort array to SELECT element
  var write_selected_order = function(select, settings, selected_order) {
    select.setAttribute("data-selected-order", JSON.stringify(selected_order));
  }

  // Refreshes an already constructed multi.js instance
  var refresh_select = function(select, settings) {
    // Clear columns
    select.wrapper.lists.selected.innerHTML = "";
    select.wrapper.lists.non_selected.innerHTML = "";

    // Add headers to columns
    if (settings.non_selected_header && settings.selected_header) {
      var non_selected_header = document.createElement("div");
      var selected_header = document.createElement("div");

      non_selected_header.className = "header";
      selected_header.className = "header";

      non_selected_header.innerText = settings.non_selected_header;
      selected_header.innerText = settings.selected_header;

      select.wrapper.lists.non_selected.appendChild(non_selected_header);
      select.wrapper.lists.selected.appendChild(selected_header);
    }

    // Get search value
    if (select.wrapper.search) {
      var query = select.wrapper.search.value;
    }

    // Current group
    var item_group = null;
    var current_optgroup = null;

    var selected_order = read_selected_order(select, settings);
    //console.log("data-selected-order="+selected_order);
    var selected_elems = [];
    var hilight_index = select.getAttribute('data-multi-hilight');

    // Loop over select options and add to the non-selected and selected columns
    for (var i = 0; i < select.options.length; i++) {
      var option = select.options[i];

      var value = option.value;
      var label = option.textContent || option.innerText;

      var row = document.createElement("li");
      row.tabIndex = 0;
      row.className = "item";
      row.innerText = label;
      row.setAttribute("role", "option");
      row.setAttribute("data-value", value);
      row.setAttribute("multi-index", i);

      if (option.disabled) {
        row.className += " disabled";
      }

      // Add row to selected column if option selected
      if (option.selected) {
        row.className += " selected";
        var clone = row.cloneNode(true);
        if (hilight_index == i)
          clone.className += " hilight";
        selected_elems.push(clone);
      } else {
        if (hilight_index == i)
          row.className += " hilight";
      }

      // Create group if entering a new optgroup
      if (
        option.parentNode.nodeName == "OPTGROUP" &&
        option.parentNode != current_optgroup
      ) {
        current_optgroup = option.parentNode;
        item_group = document.createElement("div");
        item_group.className = "item-group";

        if (option.parentNode.label) {
          var groupLabel = document.createElement("span");
          groupLabel.innerHTML = option.parentNode.label;
          groupLabel.className = "group-label";
          item_group.appendChild(groupLabel);
        }

        select.wrapper.lists.non_selected.appendChild(item_group);
      }

      // Clear group if not inside optgroup
      if (option.parentNode == select) {
        item_group = null;
        current_optgroup = null;
      }

      // Apply search filtering
      if (
        !query ||
        (query && label.toLowerCase().indexOf(query.toLowerCase()) > -1)
      ) {
        // Append to group if one exists, else just append to wrapper
        if (item_group != null) {
          item_group.appendChild(row);
        } else {
          select.wrapper.lists.non_selected.appendChild(row);
        }
      }
    }

    // populate selected list:
    var val, idx, elem;
    //console.log("selected_elems.length="+selected_elems.length);
    // first, traverse order array and find matching selected HTMLOptionElements
    for(var s=0; s<selected_order.length; s++) {
      val = selected_order[s];
      //console.log("looking for val="+val+ " "+typeof val);
      idx = selected_elems.find_option_by_value(val);
      if (idx >= 0) {
        //console.log("find_option_by_value found! for val="+val+" idx="+idx);
        select.wrapper.lists.selected.appendChild(selected_elems[idx]);
        selected_elems.splice(idx, 1);
      }
    }
    // next, append remaining HTMLOptionElements
    //console.log("remaining selected_elems.length="+selected_elems.length+" " +JSON.stringify(selected_elems));
    for(var s=0; s<selected_elems.length; s++) {
      select.wrapper.lists.selected.appendChild(selected_elems[s]);
      selected_order.push(selected_elems[s].getAttribute("data-value"));
    }
    //console.log("final selected_order="+selected_order);
    write_selected_order(select, settings, selected_order);

    // Hide empty optgroups
    if (settings.hide_empty_groups) {
      var optgroups = document.getElementsByClassName('item-group');
      for (var i = 0; i < optgroups.length; i++) {
        // Hide optgroup if optgroup only contains a group label
        if (optgroups[i].childElementCount < 2) {
          optgroups[i].style.display = 'none';
        }
      }
    }
  };

  // Array of HTMLElements returns the array index of element with given data-value of v or null.
  Array.prototype.find_option_by_value = function( v ) {
    for (var i = 0; i < this.length; i++) {
      //console.log("checking i="+i+" el.value="+this[i].getAttribute("data-value") +" vs "+v);
      if (this[i].getAttribute("data-value") == v)
        return i;
    }
    return -1;
  }

  // Intializes and constructs an multi.js instance
  // @param {HTMLSelectElement} select - DOM element of <SELECT>
  var init = function(select, settings) {
    /**
     * Set up settings (optional parameter) and its default values
     *
     * Default values:
     * enable_search : true
     * search_placeholder : "Search..."
     */
    settings = typeof settings !== "undefined" ? settings : {};

    settings["enable_search"] =
      typeof settings["enable_search"] !== "undefined"
        ? settings["enable_search"]
        : true;
    settings["search_placeholder"] =
      typeof settings["search_placeholder"] !== "undefined"
        ? settings["search_placeholder"]
        : "Search...";
    settings["non_selected_header"] =
      typeof settings["non_selected_header"] !== "undefined"
        ? settings["non_selected_header"]
        : null;
    settings["selected_header"] =
      typeof settings["selected_header"] !== "undefined"
        ? settings["selected_header"]
        : null;
    settings["limit"] =
      typeof settings["limit"] !== "undefined"
        ? parseInt(settings["limit"])
        : -1;
    if (isNaN(settings["limit"])) {
      settings["limit"] = -1;
    }
    settings["hide_empty_groups"] =
      typeof settings["hide_empty_groups"] !== "undefined"
        ? settings["hide_empty_groups"]
        : false;
    settings["selected_order"] =
      Array.isArray(settings["selected_order"])
        ? settings["selected_order"]
        : [];
    settings["show_move_buttons"] =
      typeof settings["show_move_buttons"] !== "undefined"
        ? settings["show_move_buttons"]
        : false;

    // Check if already initalized
    if (select.dataset.multijs != null) {
      return;
    }

    // Make sure element is select and multiple is enabled
    if (select.nodeName != "SELECT" || !select.multiple) {
      return;
    }

    // Hide select
    select.style.display = "none";
    select.setAttribute("data-multijs", true);
    select.setAttribute("data-selected-order", JSON.stringify(settings["selected_order"]));

    // Start constructing selector
    var wrapper = document.createElement("div");
    wrapper.className = "multi-wrapper";

    // Add search bar
    if (settings.enable_search) {
      var search = document.createElement("input");
      search.className = "search-input";
      search.type = "text";
      search.setAttribute("placeholder", settings.search_placeholder);
      search.setAttribute("title", settings.search_placeholder);

      search.addEventListener("input", function() {
        refresh_select(select, settings);
      });

      wrapper.appendChild(search);
      wrapper.search = search;
    }

    // Start constructing lists
    var lists = document.createElement("div");
    lists.className = "multi-wraplists";

    // Add columns for selected and non-selected
    var non_selected = document.createElement("ol");
    non_selected.className = "non-selected-wrapper";
    non_selected.setAttribute("role", "listbox");

    var selected = document.createElement("ol");
    selected.className = "selected-wrapper";
    selected.setAttribute("role", "listbox");

    // Add keyboard handler to toggle the selected status
    wrapper.addEventListener("keypress", function(event) {
      var is_action_key = event.keyCode === 32 || event.keyCode === 13;
      var is_option = event.target.getAttribute("multi-index");

      if (is_option && is_action_key) {
        // Prevent the default action to stop scrolling when space is pressed
        event.preventDefault();
        toggle_option(select, is_option, settings);
      }
    });

    lists.appendChild(non_selected);

    // Add Move Right/Left buttons
    if (settings.show_move_buttons) {
      var wrapper_center = document.createElement("div");  // wrapper for move buttons, for layout
      var move_right_btn = document.createElement("button");
      var move_left_btn = document.createElement("button");

      wrapper_center.className = "wrapper-center";
      move_right_btn.className = "btn btn-right";
      move_left_btn.className = "btn btn-left";
      move_right_btn.setAttribute("type", "button");
      move_left_btn.setAttribute("type", "button");
      move_right_btn.innerHTML = (settings.button_up_label ? settings.button_up_label : "\u2192"); // Unicode RIGHTWARDS arrow
      move_left_btn.innerHTML = (settings.button_down_label ? settings.button_down_label : "\u2190"); // Unicode LEFTWARDS arrow

      wrapper_center.appendChild(move_right_btn);
      wrapper_center.appendChild(move_left_btn);

      lists.appendChild(wrapper_center);

      // Add click handler to Left button
      move_left_btn.addEventListener("click", function(event) {
        var multi_index = parseInt(select.getAttribute('data-multi-hilight'));
        //console.log("Left button multi_index="+multi_index);
        if (multi_index >= 0) {
          var option = select.options[multi_index];
          if (!option.disabled && option.selected) {
            toggle_option(select, multi_index, settings);
          }
        }
      });

      // Add click handler to Right button
      move_right_btn.addEventListener("click", function(event) {
        var multi_index = parseInt(select.getAttribute('data-multi-hilight'));
        //console.log("Right button multi_index="+multi_index);
        if (multi_index >= 0) {
          var option = select.options[multi_index];
          if (!option.disabled && !option.selected) {
            toggle_option(select, multi_index, settings);
          }
        }
      });
    }

    lists.appendChild(selected);

    lists.non_selected = non_selected;
    lists.selected = selected;

    wrapper.appendChild(lists);
    wrapper.lists = lists;
    select.wrapper = wrapper;

    // Add multi.js wrapper after select element
    select.parentNode.insertBefore(wrapper, select.nextSibling);

    // Add dblclick handler to toggle the selected status
    wrapper.addEventListener("dblclick", function(event) {
      //console.log("dblclick");
      if (event.target.getAttribute("multi-index")) {
        toggle_option(select, event.target.getAttribute("multi-index"), settings);
      }
    });

    // Add click handler to toggle the hilight status
    wrapper.addEventListener("click", function(event) {
      //console.log("click");
      if (event.target.getAttribute("multi-index")) {
        if (wrapper.lists.selected.contains(event.target)
          || wrapper.lists.non_selected.contains(event.target)) {
          toggle_option_hilight(select, event, settings);
        }
      }
      //else console.log("click selected - no multi-index");
    });

    // Add Up Down buttons
    if (settings.selected_updown) {
      var wrapper_below = document.createElement("div");  // wrapper below both lists, for layout
      var wrapper_left = document.createElement("div"); // empty box below left list, for layout
      var wrapper_buttons = document.createElement("div");  // wrapper for controls below right list
      var selected_up_btn = document.createElement("button");
      var selected_down_btn = document.createElement("button");

      wrapper_below.className = "wrapper-low";
      wrapper_buttons.className = "controls";
      wrapper_left.className = "controls";
      selected_up_btn.className = "btn btn-up";
      selected_down_btn.className = "btn btn-down";
      selected_up_btn.setAttribute("type", "button");
      selected_down_btn.setAttribute("type", "button");
      selected_up_btn.innerHTML = (settings.button_up_label ? settings.button_up_label : "\u2191"); // Unicode UPWARDS arrow
      selected_down_btn.innerHTML = (settings.button_down_label ? settings.button_down_label : "\u2193"); // Unicode DOWNWARDS arrow

      wrapper_buttons.appendChild(selected_up_btn);
      wrapper_buttons.appendChild(selected_down_btn);
      wrapper_below.appendChild(wrapper_left);
      // Add a padding center DIV if we also show Move buttons
      if (settings.show_move_buttons) {
        var wrapper_center2 = document.createElement("div");  // wrapper for move buttons, for layout
        wrapper_center2.className = "wrapper-center";
        wrapper_below.appendChild(wrapper_center2);
      }
      wrapper_below.appendChild(wrapper_buttons);
      //select.wrapper.appendChild(wrapper_below);

      // Add controls wrapper after lists wrapper
      wrapper.appendChild(wrapper_below);

      // Add click handler to up button
      selected_up_btn.addEventListener("click", function(event) {
        //console.log("Up button");
        move_up(select, event, settings);
      });
      // Add click handler to up button
      selected_down_btn.addEventListener("click", function(event) {
        //console.log("Down button");
        move_down(select, event, settings);
      });
    }

    // Save current state
    for (var i = 0; i < select.options.length; i++) {
      var option = select.options[i];
      option.setAttribute("data-origin-disabled", option.disabled);
    }

    // Check limit on initialization
    check_limit(select, settings);

    // Initialize selector with values from select element
    refresh_select(select, settings);

    // Refresh selector when select values change
    select.addEventListener("change", function() {
      refresh_select(select, settings);
    });
  };

  return init;
})();

/**
 * read sort array from SELECT element
 * @param {HTMLSelectElement} select - DOM element of <SELECT>
 * @returns {string[]]} array of value attributes of the OPTION elements
 */
var multi_get_selected_order = function(select) {
  if (!select) return undefined;

  try {
    var order = select.getAttribute("data-selected-order");
    if (order)
      return JSON.parse(order);
    else
      return undefined;
  } catch(e) {
    return [];
  }
}

// Add jQuery wrapper if jQuery is present
if (typeof jQuery !== "undefined") {
  (function($) {
    $.fn.multi = function(arg) {
      if (typeof arg === "string") {
        if (arg === "multi_get_selected_order") {
          var $select = $(this);
          if ($select.length > 1)
            throw "Method call only supported on a single jQuery object.";

          return multi_get_selected_order($select.get(0));
        }
      } else {
        settings = typeof arg !== "undefined" ? arg : {};

        return this.each(function() {
          var $select = $(this);

          multi($select.get(0), settings);
        });
      }
    };
  })(jQuery);
}
