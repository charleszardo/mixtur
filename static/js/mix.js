var audio = new Audio(),
    shuffle_songs = [],
    songs = [],
    song_titles = [],
    current_song_i = 0,
    current_song, shuffle_on, anthology_on, hilite_col, listen_registered,
    hilite_txt_col, dragging, bg_col, txt_col, accent_col;


var audio_els = document.getElementsByTagName('audio');
var titles_els = document.getElementsByClassName('track');
for(var i = 0; i < audio_els.length; i++){
  songs.push(audio_els[i].src);
  song_titles.push(titles_els[i].title);
}
var shuffled_songs = shuffleArray(songs);


d3.select("body")
    .on("keydown", function() {
      // spacebar
      if(d3.event.keyCode == 32){
        if(current_song){
          if(is_playing(current_song)){
            current_song.pause();
          }
          else {
            current_song.play();
          }
        }
        d3.event.preventDefault();
      }
    })

d3.selectAll("li.track").on("click", function(d, i){
  current_song_i = i;
  audio.src = songs[current_song_i];
  audio.currentTime = 0;
  audio.pause();
  audio.load();
  audio.play();
  audio.setAttribute('title', song_titles[current_song_i]);
})


// d3.selectAll("li.track").on("click", function(d, i){
//   // d3.selectAll("li.track").classed("active", false)
//   // var is_active = d3.select(this).classed("active")
//   // d3.select(this).classed("active", !is_active)
//   shuffle_on = false;
//   anthology_on = true;
//
//   var song = d3.select(this).select("audio").node();
//   if(is_playing(song)){
//     song.pause();
//   }
//   else {
//     var songs = d3.selectAll("audio");
//     songs.each(function(){
//       this.pause();
//       if(this !== song){
//         if(this.currentTime){
//           this.currentTime = 0;
//         }
//       }
//     })
//     song.play();
//   }
// })

audio.addEventListener('timeupdate',function(){
  d3.select("i.fa-play").style("display", "none");
  d3.select("i.fa-pause").style("display", "inline");
  if(!dragging){
    var load_progress = (this.buffered.end(this.buffered.length-1) / this.duration) * 100;
    var progress = (this.currentTime / this.duration) * 100;
    var this_li = d3.select(document.querySelectorAll("li.track")[current_song_i]);
    // console.log(this, this.currentTime, this.duration, progress, this_li);
    d3.select(".track-progress").style("width", progress+"%");
    d3.select(".track-progress-loaded").style("width", load_progress+"%");
    this_li.select(".track-time span").text(formatSecondsAsTime(this.currentTime) + " / ");
    if(progress > 75.4 && listen_registered !== true){
      d3.selectAll(".track-time span").style("display", "none")
      var listen_url = window.location.pathname + "listen/" + this_li.attr("data-id") + '/';
      listen_registered = true;
      d3.xhr(listen_url)
        .header("Content-Type", "application/json")
        .post(
            JSON.stringify({listen: this_li.attr("data-id")}),
            function(err, rawData){
              // console.log("listen response:", data);
            }
        );
    }
  }
})

audio.addEventListener('play',function(){
  current_song = this;
  stop_all(this);
  listen_registered = false;
  d3.selectAll(".track-time span").style("display", "none")
  d3.selectAll("li.track").classed("active", false);
  d3.select("i.fa-play").style("display", "none");
  d3.select("i.fa-pause").style("display", "inline");
  var this_li = d3.select(document.querySelectorAll("li.track")[current_song_i]);
  d3.select(".track-progress-bg").style("width", "100%");
  // this_li.select("p.track-num i").style("display", "inline")

  this_li.select(".track-time span").style("display", "inline")
  hilite(this_li, true)
})

audio.addEventListener('pause',function(){
  d3.select("i.fa-play").style("display", "inline");
  d3.select("i.fa-pause").style("display", "none");
})

audio.addEventListener('ended',function(){
  var this_li = d3.select(document.querySelectorAll("li.track")[current_song_i]);
  hilite(this_li, false)
  
  if(shuffle_on) {
    current_song_i = songs.indexOf(shuffled_songs.pop())
    var next_song_src = songs[current_song_i];
  }
  else {
    var currplace = songs.indexOf(this.src);
    current_song_i = currplace+1;
    var next_song_src = songs[currplace+1];
  }
  
  if(next_song_src){
    audio.src = next_song_src;
    audio.pause();
    audio.load();
    audio.play();
    audio.setAttribute('title', song_titles[currplace+1]);
  }
  else {
    shuffle_on = false;
    current_song = null;
    current_song_i = 0;
    d3.selectAll("li.track").classed("active", false);
    d3.select("a.fa-random").classed("active", false);
    d3.selectAll(".track-progress-bg, .track-progress, .track-progress-loaded").style("width", "0");
    console.log('album done...')
  }
  return;
  
  var this_li = d3.select(this.parentNode.parentNode.parentNode);
  hilite(this_li, false)
  var next = get_next(this);
  if (next) {
    // next.play();
    
    // audiox.src = d3.select(next).attr("src");
    // audiox.pause();
    // audiox.load();
    // audiox.play();
    
  }
  else {
    shuffle_on = false;
    current_song = null;
    // d3.selectAll("li.track").classed("active", false);
    console.log('album done...')
  }
});

d3.selectAll("i.fa-play").on("click", function(){
  if(audio.src) {
    audio.play();
  }
  else {
    // d3.select("audio").node().play();
    audio.src = d3.select("audio").attr("src");
    audio.pause();
    audio.load();
    audio.play();
    audio.setAttribute('title', song_titles[0]);
  }
  if(d3.select(this).classed("anthology-play")){
    anthology_on = true;
  }
  else {
    anthology_on = false;
  }
})

d3.selectAll("i.fa-pause").on("click", function(){
  audio.pause();
})

d3.selectAll("i.fa-step-backward").on("click", function(){
  if(audio.src){
    var amt_played = audio.currentTime / audio.duration;
    // if(amt_played > 0.1){
    //   audio.currentTime = 0;
    // }
    if(audio.currentTime > 2){
      audio.currentTime = 0;
    }
    else {
      current_song_i = Math.max(current_song_i-1, 0);
      var prev_song_src = songs[current_song_i];
      if (prev_song_src) {
        audio.src = prev_song_src;
        audio.pause();
        audio.load();
        audio.play();
        audio.setAttribute('title', song_titles[current_song_i]);
      }
    }
  }
})

d3.selectAll("i.fa-step-forward").on("click", function(){
  if(!audio.paused){
    
    if(shuffle_on) {
      if(!shuffled_songs.length){
        return
      }
      current_song_i = songs.indexOf(shuffled_songs.pop());
    }
    else {
      current_song_i = (current_song_i+1) % songs.length;
    }
    console.log(current_song_i)
    
    var next_song_src = songs[current_song_i];
    if(next_song_src){
      audio.src = next_song_src;
      audio.pause();
      audio.load();
      audio.play();
      audio.setAttribute('title', song_titles[current_song_i]);
    }
  }
})

d3.selectAll("a.fa-random").on("click", function(){
  if(!shuffle_on){
    shuffled_songs = shuffleArray(songs);
  }
  shuffle_on = !shuffle_on;
  
  if(shuffle_on){
    current_song_i = songs.indexOf(shuffled_songs.pop())
    audio.src = songs[current_song_i];
    audio.currentTime = 0;
    audio.pause();
    audio.load();
    audio.play();
    audio.setAttribute('title', song_titles[current_song_i]);
  }
  
  d3.select("a.fa-random").classed("active", !d3.select("a.fa-random").classed("active"));
  
  d3.event.preventDefault();
})

function is_playing(audio) {
    return !audio.paused && !audio.ended && 0 < audio.currentTime;
}
function get_next(audio_el){
  if(shuffle_on){
    var rand_i = Math.floor(Math.random() * shuffle_songs.length)
    var rand_song = shuffle_songs[rand_i];
    shuffle_songs.splice(rand_i, 1);
    return rand_song;
  }
  else {
    var next_li = audio_el.parentNode.parentNode.parentNode.nextElementSibling;
    if(!next_li){
      var next_disc = audio_el.parentNode.parentNode.parentNode.parentNode.parentNode.nextElementSibling;
      if(!next_disc && anthology_on){
        var next_disc = audio_el.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.nextElementSibling;
        if(!next_disc){
          return null;
        }
      }
      var next_li = d3.select(next_disc).select("li.track").node();
    }
    return d3.select(next_li).select("audio").node();
  }
}
function get_prev(audio_el){
  var prev_li = audio_el.parentNode.parentNode.parentNode.previousElementSibling;
  if(!prev_li){
    var prev_disc = audio_el.parentNode.parentNode.parentNode.parentNode.parentNode.previousElementSibling;
    if(!prev_disc && anthology_on){
      var prev_disc = audio_el.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.previousElementSibling;
      if(!prev_disc){
        return null;
      }
    }
    var prev_li = d3.select(prev_disc).select("li.track").node();
  }
  return d3.select(prev_li).select("audio").node();
}
function stop_all(exception_el) {
  d3.selectAll("audio").each(function(){
    if(this !== exception_el){
      var this_li = d3.select(this.parentNode.parentNode.parentNode);
      hilite(this_li, false)
      this.pause();
      if(this.currentTime){
        this.currentTime = 0;
      }
    }
  })
}
function hilite(li, turn_on){
  var album_el = d3.select(getParents(li.node(), ".album")[0]);
  var bg_col = album_el.attr("data-bg-col");
  var hilite_col = album_el.attr("data-hilite-col");
  if(!hilite_col){
    hilite_col = d3plus.color.text(bg_col);
  }
  var hilite_col_2 = album_el.attr("data-hilite-col2");
  if(!hilite_col_2){
    hilite_col_2 = d3plus.color.text(bg_col);
  }
  
  if(turn_on === false){
    li.classed("active", false);
    li.style("background", bg_col);
    li.select(".track-num").style("color", hilite_col_2);
    li.select(".track-time").style("color", hilite_col_2);
    li.select(".track-name").style("color", hilite_col);
    li.select(".track-artist").style("color", hilite_col_2);
    li.select(".track-listens").style("color", hilite_col_2);
    li.select(".track-listens").style("border-color", hilite_col_2);
  }
  else{
    li.classed("active", true);
    li.style("background", hilite_col);
    li.select(".track-num").style("color", bg_col);
    li.select(".track-time").style("color", bg_col);
    li.select(".track-name").style("color", bg_col);
    li.select(".track-artist").style("color", bg_col);
    li.select(".track-listens").style("color", bg_col);
    li.select(".track-listens").style("border-color", bg_col);
  }
}

d3.selectAll(".no-col").style("color", function(){
  if(getParents(this, ".album")){
    var bg = d3.rgb(d3.select(getParents(this, ".album")[0]).style("background"));
  }
  else {
    var bg = d3.rgb(d3.select(getParents(this, ".anthology-title")[0]).style("background"));
  }
  return d3plus.color.text(bg)
})

d3.select(".progress").on("mousemove", function(){
  var left = d3.event.pageX - parseInt(d3.selectAll("div.album").style("padding-left"));
  var left_pct = (left / this.offsetWidth) * 100;
  var progress_w = d3.select(".track-progress").style("width")
  // if(left > parseInt(progress_w)){
  //   this_li.select(".track-cursor").style("background", function(){ return this_li.attr("data-hilite-txt-col"); })
  // }
  // else {
  //   this_li.select(".track-cursor").style("background", function(){ return this_li.attr("data-hilite-col"); })
  // }
  if(parseInt(d3.select(".track-progress-bg").style("width")) > 0){
    d3.select(".track-cursor").style("display", "block")
    d3.select(".track-cursor").style("left", left_pct+"%")
  }
})
d3.select(".progress").on("mouseout", function(){
  d3.select(".track-cursor").style("display", "none")
})



var drag = d3.behavior.drag()
  .on("dragstart", function(){
    dragging = true;
  })
  .on("drag", function(){
    var left = Math.min(Math.max(0, d3.event.x), this.offsetWidth);
    var left_pct = (left / this.offsetWidth) * 100;
    d3.select(".track-progress").style("width", left_pct+"%");
    // console.log(this, left, left_pct)
  })
  .on("dragend", function(){
    dragging = false;
  });
d3.select(".progress")
  .on("mouseup", function(){
    var left = Math.max(0, d3.event.x);
    var left_pct = (left / this.offsetWidth);
    var seek_time = current_song.duration * left_pct;
    // console.log(seek_time, current_song.currentTime, current_song.duration)
    current_song.currentTime = seek_time;
  })
  .call(drag);

d3.selectAll(".delete").on("click", function(){
  var txt = 'Are you sure want to continue? This will delete the entire mix and all songs associated with it.'
  if (mix_type == "a"){
    txt = 'Are you sure want to continue? This will delete this anthology but will not delete any of the mixes or songs associated with it.'
  }
  if(confirm(txt)){
    return true;
  }
  else {
    d3.event.preventDefault();
  }
})


// determine color of progress bar -- 
function get_brightness(col){
  var rgb = d3.rgb(col);
  return (299*rgb.r + 587*rgb.g + 114*rgb.b) / 1000
}

if(mix_type != "a" && palette.length > 2){
  d3.select(".track-progress").style("background", function(){
    var bg_col = palette[0],
        hilite_col = palette[1],
        hilite_col2 = palette[2];
  
    var bg_brightness = get_brightness(bg_col),
        hilite_brightness = get_brightness(hilite_col),
        hilite2_brightness = get_brightness(hilite_col2);
  
    if(Math.abs(hilite_brightness - bg_brightness) > Math.abs(hilite_brightness - hilite2_brightness)){
      return bg_col;
    }
    return hilite_col2;
  })
}

// set hover for tracks
d3.selectAll(".tracklisting ol li.track")
  .on("mouseover", function(){
    if(d3.select(this).classed("active")) return;
    var this_album = getParents(this, ".album");
    var this_bg_col = d3.select(this_album[0]).attr("data-bg-col");
    var hcl_col = d3.hcl(this_bg_col);
    d3.select(this).style("background", function(){
      var bg_brightness = get_brightness(hcl_col),
          bg_darker_brightness = get_brightness(hcl_col.darker()),
          bg_brighter_brightness = get_brightness(hcl_col.brighter());
      if(Math.abs(bg_brightness - bg_darker_brightness) > Math.abs(bg_brightness - bg_brighter_brightness)){
        return hcl_col.darker();
      }
      return hcl_col.brighter();
    })
  })
  .on("mouseout", function(){
    if(d3.select(this).classed("active")) return;
    d3.select(this).style("background", "none");
  })

// set hover for top header
d3.selectAll(".album a, .anthology-title a, body > header a")
  .on("mouseover", function() { 
    var this_album = getParents(this, ".album") || getParents(this, ".anthology-title") || [d3.select(".album").node()];
    var this_bg_col = d3.select(this_album[0]).attr("data-bg-col");
    var hcl_col = d3.hcl(this_bg_col);
    d3.select(this).style("color", function(){
      var bg_brightness = get_brightness(hcl_col),
          bg_darker_brightness = get_brightness(hcl_col.darker()),
          bg_brighter_brightness = get_brightness(hcl_col.brighter());
      if(Math.abs(bg_brightness - bg_darker_brightness) > Math.abs(bg_brightness - bg_brighter_brightness)){
        return hcl_col.darker();
      }
      return hcl_col.brighter();
    })
  })
  .on("mouseout", function() {
    d3.select(this).style("color", "inherit")
  });

// set offset height for tracks since header could be multiple lines
var header_h = d3.select(".anthology header").style("height");
d3.select(".anthology .tracks").style("padding-top", header_h);

// set hover for mix description
d3.selectAll(".album-art")
  .on("mouseover", function(){
    d3.select(this).select(".album-desc").style("opacity", 1)
  })
  .on("mouseout", function(){
    d3.select(this).select(".album-desc").style("opacity", 0)
  })

d3.select(".track-progress-loaded").style("background", function(){
  var lab_col = d3.lab(d3.select(this).style("background"));
  if(lab_col.l < 50){
    return lab_col.brighter();
  }
  return lab_col.darker();
})

/**
 * Randomize array element order in-place.
 * Using Durstenfeld shuffle algorithm.
 */
function shuffleArray(array) {
  var newArray = array.slice(0);
    for (var i = newArray.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = newArray[i];
        newArray[i] = newArray[j];
        newArray[j] = temp;
    }
    return newArray;
}