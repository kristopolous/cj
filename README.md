A fairly old library that does a bunch of base level things.

You should probably use [underscore](http://documentcloud.github.com/underscore/) unless you want to do a few things here:

### Automatically open a link in a new tab

    $cj.newTab.magic(url)

### Force a download through a hidden iframe

    $cj.download(url)

### Force a reload of a page

    $cj.reload()

### Have a simple template language

#### Example
    Hey, you are using ###navigator.userAgent###.

    $cj.filler(dom node)   

### Attach tne enter key to some node

    $cj.onEnter(dom, function)

### Serialize a hash into a flat list

    $cj.obj.list({a: '1', b: '2'})

#### Go the other way

    $cj.list.obj(['a', 1, 'b', 2])

### Strip HTML from a block of text

    $cj.txt.plain(document.body.innerHTML);

### Convert http://something.com text into links

    $cj.txt.linkify("Go to http://qaa.ath.cx for my homepage");

### Express time via a format string

    $cj.txt.time("The year is %Y and the month is %N. It's %h:%m right now.")

### Pad a number left with zeros

    $cj.txt.padLeft("10", 5) => 00010

### Trim whitespace

    $cj.txt.trim("  hello world  ");

### Get rid of \u0012Unicode\u4123 garbage

    $cj.txt.utf8(badstring)
