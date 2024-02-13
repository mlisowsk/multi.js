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
  var toggle_option = function(select, event, settings) {
    var option = select.options[event.target.getAttribute("multi-index")];

    if (option.disabled) {
      return;
    }

    option.selected = !option.selected;

    check_limit(select, settings);

    trigger_event("change", select);
  };

  // Toggles hilight state of an option
  var toggle_option_hilight = function(select, event, settings) {
    var option = select.options[event.target.getAttribute("multi-index")];
		//console.log("toggle_option_hilight");
    if (option.disabled) {
      return;
    }

		var hi = (option.getAttribute('data-multi-hilight') === "true");
		//console.log("toggle-option-highlight: bef="+hi+ " "+typeof hi+" aft="+(!hi));
		option.setAttribute('data-multi-hilight', ""+!hi);

		//var $options = self.$right.find(':selected:not(span):not(.hidden)');
    //option.selected = !option.selected;

    //check_limit(select, settings);

    trigger_event("change", select);
  };

  // Refreshes an already constructed multi.js instance
  var refresh_select = function(select, settings) {
    // Clear columns
    select.wrapper.selected.innerHTML = "";
    select.wrapper.non_selected.innerHTML = "";

    // Add headers to columns
    if (settings.non_selected_header && settings.selected_header) {
      var non_selected_header = document.createElement("div");
      var selected_header = document.createElement("div");

      non_selected_header.className = "header";
      selected_header.className = "header";

      non_selected_header.innerText = settings.non_selected_header;
      selected_header.innerText = settings.selected_header;

      select.wrapper.non_selected.appendChild(non_selected_header);
      select.wrapper.selected.appendChild(selected_header);
    }

    // Get search value
    if (select.wrapper.search) {
      var query = select.wrapper.search.value;
    }

    // Current group
    var item_group = null;
    var current_optgroup = null;
console.log("data-selected-order="+select.getAttribute("data-selected-order"));
		var selected_order;
		try {
			var selected_order = JSON.parse(select.getAttribute("data-selected-order"));
		} catch(e) {
			var selected_order = [];
		}
	
		var selected_elems = [];
		
    // Loop over select options and add to the non-selected and selected columns
    for (var i = 0; i < select.options.length; i++) {
      var option = select.options[i];

      var value = option.value;
      var label = option.textContent || option.innerText;

      var row = document.createElement("a");
      row.tabIndex = 0;
      row.className = "item";
      row.innerText = label;
      row.setAttribute("role", "button");
      row.setAttribute("data-value", value);
      row.setAttribute("multi-index", i);

      if (option.disabled) {
        row.className += " disabled";
      }

			var hi = (option.getAttribute('data-multi-hilight') === "true");
			//console.log(hi);
      // Add row to selected column if option selected
      if (option.selected) {
        row.className += " selected";
        var clone = row.cloneNode(true);
				if (hi)
					clone.className += " hilight";
				selected_elems.push(clone);
        //select.wrapper.selected.appendChild(clone);
      }

			if (hi) {
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

        select.wrapper.non_selected.appendChild(item_group);
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
          select.wrapper.non_selected.appendChild(row);
        }
      }
    }
		
		// populate selected list:
		var val, idx, elem;
		console.log("selected_elems.length="+selected_elems.length+" " +JSON.stringify(selected_elems));
		// first, traverse order array and find matching selected HTMLOptionElements
		for(var s=0; s<selected_order.length; s++) {
			val = selected_order[s];
			console.log("looking for val="+val+ " "+typeof val);
			idx = selected_elems.find_option_by_value(val);
			if (idx >= 0) {
				console.log("find_option_by_value found! for val="+val+" idx="+idx);
				select.wrapper.selected.appendChild(selected_elems[idx]);
				selected_elems.splice(idx, 1);
			}
		}
		// next, append remaining HTMLOptionElements
		console.log("remaining selected_elems.length="+selected_elems.length+" " +JSON.stringify(selected_elems));
		for(var s=0; s<selected_elems.length; s++) {
			select.wrapper.selected.appendChild(selected_elems[s]);
			selected_order.push(selected_elems[s].getAttribute("data-value"));
		}
		console.log("final selected_order="+selected_order);
		select.setAttribute("data-selected-order", JSON.stringify(selected_order));
		

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
		return this.findIndex(function(el,i){
			console.log("checking i="+i+" el.value="+el.getAttribute("data-value") +" vs "+v+" for "+JSON.stringify(el));
			return (el.getAttribute("data-value") == v);});
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

    // Add columns for selected and non-selected
    var non_selected = document.createElement("div");
    non_selected.className = "non-selected-wrapper";

    var selected = document.createElement("div");
    selected.className = "selected-wrapper";

		var preventClick = false;
		var dblclickTimer = null;
    // Add dblclick handler to toggle the selected status
    wrapper.addEventListener("dblclick", function(event) {
      if (event.target.getAttribute("multi-index")) {
				clearTimeout(dblclickTimer);
				preventClick = true;
        toggle_option(select, event, settings);
      }
    });

    // Add click handler to toggle the hilight status
    wrapper.addEventListener("click", function(event) {
      if (event.target.getAttribute("multi-index")) {
				dblclickTimer = setTimeout(() => {
						if(!preventClick){
							toggle_option_hilight(select, event, settings);
						}
						preventClick = false
					}, 250);
      }
    });

    // Add keyboard handler to toggle the selected status
    wrapper.addEventListener("keypress", function(event) {
      var is_action_key = event.keyCode === 32 || event.keyCode === 13;
      var is_option = event.target.getAttribute("multi-index");

      if (is_option && is_action_key) {
        // Prevent the default action to stop scrolling when space is pressed
        event.preventDefault();
        toggle_option(select, event, settings);
      }
    });

    wrapper.appendChild(non_selected);
    wrapper.appendChild(selected);

    wrapper.non_selected = non_selected;
    wrapper.selected = selected;

    select.wrapper = wrapper;

    // Add multi.js wrapper after select element
    select.parentNode.insertBefore(wrapper, select.nextSibling);

		// Add Up Down buttons
		if (settings.selected_updown) {
			console.log ("adding updown buttons");
			var wrapper_below = document.createElement("div");	// wrapper below both lists, for layout
			var wrapper_left = document.createElement("div");	// empty box below left list, for layout
			var wrapper_buttons = document.createElement("div");	// wrapper for controls below right list
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
			selected_down_btn.innerHTML = (settings.button_down_label ? settings.button_down_label : "\u2193");	// Unicode DOWNWARDS arrow

			wrapper_buttons.appendChild(selected_up_btn);
			wrapper_buttons.appendChild(selected_down_btn);
			wrapper_below.appendChild(wrapper_left);
			wrapper_below.appendChild(wrapper_buttons);
			//select.wrapper.appendChild(wrapper_below);

			// Add controlws wrapper after multi.js wrapper
			select.parentNode.insertBefore(wrapper_below, wrapper.nextSibling);
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

// Add jQuery wrapper if jQuery is present
if (typeof jQuery !== "undefined") {
  (function($) {
    $.fn.multi = function(settings) {
      settings = typeof settings !== "undefined" ? settings : {};

      return this.each(function() {
        var $select = $(this);

        multi($select.get(0), settings);
      });
    };
  })(jQuery);
}
