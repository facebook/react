// How input type="date" is used

// The simplest implementation of the element is just to declare the input type as date. A properly marked up label or prompt for the field should be provided so that screen reader users understand what the field is for, and Dragon NaturallySpeaking users can quickly reference the control.

<label for="start">Start date:</label>
<input type="date" id="start" name="start"></input>

// If required, a default (or previously stored) value can be set using the value attribute in the format ‘yyyy-mm-dd’.

// Additionally, it is possible to set minimum and maximum allowed dates using the min and max attributes. The idea here is for the browser to validate the user’s input and warn them if it steps outside a valid range.

// Here’s an example showing the use of all these attributes – to default to a date, and constrain the input to the following four weeks.Here

<label for="start">Start date:</label>
<input type="date" id="start" name="start"
value="2019-02-06"
min="2019-02-06" max="2019-03-05"></input>

