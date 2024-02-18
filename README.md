multi.js
=======

multi.js is a user-friendly replacement for select boxes with the multiple attribute. It has no dependencies, is mobile-friendly, and provides search functionality. multi.js is also easy to style with CSS and optionally supports jQuery.

Check out the [demo](https://fabianlindfors.se/multijs/).

![Preview of multi.js](https://fabianlindfors.se/multijs/images/preview.png)

Installation
-----
Install with npm:

```bash
npm install --save multi.js
```

Install with yarn:

```bash
yarn add multi.js
```

After installing with npm or yarn, import both the library and stylesheet:

```bash
import multi from "multi.js/dist/multi-es6.min.js";
import "multi.js/dist/multi.min.css";
```

Install manually by cloning or downloading the repository to your project and including both files in the dist directory.

```html
<link rel="stylesheet" type="text/css" href="multijs/dist/multi.min.css">
<script src="multijs/dist/multi.min.js"></script>
```

Usage
-----
multi.js can be applied to any select element with the multiple attribute enabled.

```javascript
var select_element = document.getElementById("your_select_element");
multi(select_element);
```

To customize multi a few options can be passed with the function call. Below are all the default values.

```javascript
multi(select_element, {
    "enable_search": true,
    "search_placeholder": "Search...",
    "non_selected_header": null,
    "selected_header": null,
    "limit": -1,
    "limit_reached": function () {},
    "hide_empty_groups": false,
});
```

### Column headers

To add headers to both columns set values for these options:

```javascript
multi(select_element, {
    'non_selected_header': 'All options',
    'selected_header': 'Selected options'
});
```

### Limit

You can add a limit of option selected for your select using the `limit` parameter. Default is -1, which means "no limit".

```javascript
multi(select_element, {
    'limit': 10
});
```

Additionally, there a callback is available: `limit_reached`, invoked when the user selects the last available option before reaching the limit (for example, the 10th element of a maximum of 10).

```javascript
multi(select_element, {
    'limit': 10,
    'limit_reached': function () {
      alert('You have selected 10/10 elements.');
    }
});
```

### Re-ordering selected items

Starting with v0.6 there is an option to allow users re-ordering the selected items in the right list.
When enabled, Up and Down buttons will appear below the right list. Users can select a single item and then use Up or Down to move it up or down.

```javascript
multi(select_element, {
    "selected_updown": true,        // enables re-ordering and shows buttons
    "button_up_label": "Up",        // optional text for Up button, defaults to Unicode UPWARDS ARROW
    "button_down_label": "Down",    // optional text for Down button, defaults to Unicode DOWNWARDS ARROW
    "selected_order": ["2","1","3"] // optional inital order
});
```

The `selected_order` can be used to specify an initial order of selected items that deviates from the order of the `<OPTION>` tags as they appear in HTML. `selected_order` is an array of values, that correspond to the `value` attribute of the HTML `<OPTION>` tags.

#### Reading back the order of selected items

To read-back the order of the selected items (in the right list) you can use either API:

```javascript
var array_of_values = multi_get_selected_order(select_element);
```

or when using jQuery:

```javascript
var array_of_values = $('#your_select_element').multi("multi_get_selected_order");
```

### Optional move buttons

Starting with v0.6.2 there is an option to show buttons for moving a highlighted option from left to right or vice versa.

```javascript
multi(select_element, {
    "show_move_buttons": true      // shows buttons for moving an item to left or right list
});
```


### jQuery

multi.js is fully native Javascript but also has jQuery support. If you have jQuery included multi can be applied to a select element as follows:

```javascript
$('#your_select_element').multi();
```

Contributing
-----
All contributions, big and small, are very welcome.

Use [Prettier](https://prettier.io) to format all code after editing. Build the project with Grunt and bump the version number before creating a pull request.

License
-----
multi.js is licensed under [MIT](https://github.com/Fabianlindfors/multi.js/blob/master/LICENSE).
