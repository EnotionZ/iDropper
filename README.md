iDropper
=============

Just another jQuery color picker...

...But Why?
-----------

* because there's no solution out there where I can set the color picker's dimension
* because my homeboy @justinnurse hates all the color pickers out there
* because wherever you're using this, you probably already have jQuery included
* because I built it with very little jQuery dependency and I may eventually strip out jQuery altogether
* because I want to create an entire color suite for allowing people to choose aestheticly nice colors
* because I like colors and math
* because I want to.


Usage
-----
Download and include the iDropper css & javascript files along with jQuery on your page
    <link rel="stylesheet" type="text/css" href="path_to_css/colorpicker.css">
    <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.min.js"></script>
    <script src="path_to_js/colorpicker.js"></script>

iDropper works like a jQuery plugin. Pass in 'onChange' callback which gets triggered 
when a different color is selected
    <div id="idropper_test">derp derp derp</div>
    <script>
        $('#idropper_test').iDropper({
            onChange: function(hex) {
                alert(hex);
            }
        });
    </script>

To set the dimension of iDropper, simply set 'size' on the object parameter with the number
of pixels that the saturation/value scale container should be. This container is square, so 
you only need one value
    <script>
        $('#idropper_test').iDropper({
            size: 128
        });
    </script>
