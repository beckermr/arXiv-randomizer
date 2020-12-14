    date_default_timezone_set('America/New_York');
    define('TIME_NOW', time());
    $day = intval(date('N', TIME_NOW)); // 1 for Monday, ..., 7 for Sunday
    $hr = intval(date('H', TIME_NOW)) + intval(date('i', TIME_NOW))/60.0;

    $rss = simplexml_load_file("http://export.arxiv.org/rss/astro-ph");
    $time_rss = strtotime($rss->channel->children("http://purl.org/dc/elements/1.1/")->date);

    if(true) {
if($hr >= 20.5) {
  $today = true;
} else {
  $today = false;
}
    } else {
if(date('j',$time_rss) == date('j',TIME_NOW)) {
  $today = true;
} else {
  $today = false;
}
    }

    #arXiv "logic" for sending out new articles
    #see this (http://arxiv.org/help/submit) and draw a picture
    if($day == 7) {
#sunday
if ($today) {
  #night, so seeing stuff submitted from thurs 16:00 to fri 16:00
  $de = mktime(16-2*24,0,0);
  $ds = $de - 24.0*60.0*60.0;
} else {
  #day, so seeing stuff from wed 16:00 to thurs 16:00
  $de = mktime(16-3*24,0,0);
  $ds = $de - 24.0*60.0*60.0;
}
    } elseif ($day == 1) {
#monday
if ($today) {
  #monday night, see stuff from fri 16:00 to mon 16:00
  $de = mktime(16,0,0);
  $ds = $de - 24.0*60.0*60.0*3;
} else {
  #monday day, seeing stuff from thurs 16:00 to fri 1600
  $de = mktime(16-3*24,0,0);
  $ds = $de - 24.0*60.0*60.0;
}
    } elseif ($day == 2) {
#tuesday
if($today) {
        #tuesday night is normal (monday 16 to tues 16)
  $de = mktime(16,0,0);
  $ds = $de - 24.0*60.0*60.0;
      } else {
  #tues during day is fri 16 to mon 16
        $de = mktime(-8,0,0);
  $ds = $de - 24.0*60.0*60.0*3;
}
    } elseif ($day == 5) {
#friday - no new stuff - so always see thursday night stuff (so wed 16:00 to thurs 16:00)
$de = mktime(16-24,0,0);
$ds = $de - 24.0*60.0*60.0;
    } elseif($day == 6) {
#sat - no new stuff - so always see thursday night stuff (so wed 16:00 to thurs 16:00)
$de = mktime(16-24*2,0,0);
$ds = $de - 24.0*60.0*60.0;
    } else {
#all other days are "normal"
if ($today) {
  $de = mktime(16,0,0);
} else {
  $de = mktime(-8,0,0);
}
$ds = $de - 24.0*60.0*60.0;
    }

    #construct the query
    #$base_url = 'http://export.arxiv.org/api/query?search_query=';
    #$query = $base_url . "cat:astro-ph*+AND+submittedDate:[".date('YmdH00',$ds)."+TO+".date('YmdH00',$de)."]" . "&start=0&max_results=100";

    $items = $rss->item;
    $arr = array();
    $np = 0;
    foreach($items as $entry) {
if(strpos($entry->title,"UPDATED"))
  continue;
$arr[] = $entry;
$np = $np + 1;
    }
    $items = $arr;
    shuffle($items);

    print("<div class=\"timestamp\">Showing ".$np." posts from ".date('D, j M Y H:i:s',$ds)." EDT to ".date('D, j M Y H:i:s',$de)." EDT.</div>\n");
    #print("<hr>\n");

    $i = 0;
    #output each entry
    foreach($items as $entry) {

if(strpos($entry->title,"UPDATED"))
  continue;

if($i % 2 == 0) {
  print("<div class=\"row\">\n");
}

print("<div class=\"col-xs-12 col-sm-12 col-md-6 col-lg-6\">\n");

# split the id line to get just the arxiv id
$temp = split('/abs/',$entry->link);
$temp = substr($temp[1],0,strlen($temp[1]));
$title = $entry->title;
$pos = strpos($title," (arXiv");
$title = substr($title,0,$pos);
$title = htmlspecialchars($title,ENT_HTML5);
$hdr = "<p class=\"lead tex2jax_process\"><a href=\"http://arxiv.org/abs/".$temp."\">".$temp."</a>";
$hdr = $hdr . " [<a href=\"http://arxiv.org/pdf/".$temp.".pdf\">pdf</a>]";
print($hdr.": <span class=\"title\">".$title."</span></p>\n");

# gather a list of authors
$auth = $entry->children("http://purl.org/dc/elements/1.1/");
$authors = $auth->creator;
print("<div class=\"authors\">".$authors."</div>\n");

#abstract
$abs = strip_tags($entry->description);
#$abs = htmlspecialchars($abs,ENT_HTML5);
print("<div class=\"abs tex2jax_process\">".$abs."</div>");

print("</div>\n");

if ($i % 2 == 1) {
  print("</div>\n");
}

$i = $i + 1;
    }

    if ($i % 2 == 1) {
print("</div>\n");
    }
