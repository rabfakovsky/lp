(function () {
    'use strict';

    function filmix(component, _object) {
      var network = new Lampa.Reguest();
      var extract = {};
      var results = [];
      var object = _object;
      var filter_items = {};
      var choice = {
        season: 0,
        voice: 0,
        quality: 0
      };
        if (!window.filmix) window.filmix = { max_qualitie: 720, is_max_qualitie: false }
        var url = 'http://filmixapp.cyou/api/v2/';
        var dev_token = '?user_dev_apk=1.1.2&&user_dev_name=Xiaomi&user_dev_os=11&user_dev_token=aaaabbbbccccddddeeeeffffaaaabbbb&user_dev_vendor=Xiaomi';
        var online_token = Lampa.Storage.get('filmix_token', '');
        if (online_token.length === 32 && dev_token.indexOf('aaaabbbbccccddddeeeeffff') !== -1) { dev_token = dev_token.replace('aaaabbbbccccddddeeeeffffaaaabbbb', online_token); }
      /**
       * РџРѕРёСЃРє
       * @param {Object} _object
       */


      this.search = function (_object, filmix_id) {
        object = _object;
        if (!window.filmix.is_max_qualitie && dev_token.indexOf('aaaabbbbccccddddeeeeffff') == -1) {
            window.filmix.is_max_qualitie = true;
            network.clear(); network.timeout(10000);
            network.quiet( (url + 'user_profile' + dev_token), function(found) {
                if (found && found.user_data) {
                    if (found.user_data.is_pro) window.filmix.max_qualitie = 1080;
                    if (found.user_data.is_pro_plus) window.filmix.max_qualitie = 2160;
                }
                end_search(filmix_id);
            });
        } else end_search(filmix_id);

        function end_search (filmix_id) {
            network.clear(); network.timeout(10000);
            network.silent( (window.filmix.is_max_qualitie ? url+'post/'+filmix_id+dev_token : url+'post/'+filmix_id), function(found) {
              if (found) {
                results = found;
                success(found);
              }
              component.loading(false);
              if (!Object.keys(results).length) component.empty();
            }, function () {
              component.empty();
            });
        };
      };


      this.extendChoice = function (saved) {
        Lampa.Arrays.extend(choice, saved, true);
      };
      /**
       * РЎР±СЂРѕСЃ С„РёР»СЊС‚СЂР°
       */


      this.reset = function () {
        component.reset();
        choice = {
          season: 0,
          voice: 0,
          quality: 0
        };
        filter();
        append(filtred());
        component.saveChoice(choice);
      };
      /**
       * РџСЂРёРјРµРЅРёС‚СЊ С„РёР»СЊС‚СЂ
       * @param {*} type
       * @param {*} a
       * @param {*} b
       */


      this.filter = function (type, a, b) {
        choice[a.stype] = b.index;
        component.reset();
        filter();
        append(filtred());
        component.saveChoice(choice);
      };
      /**
       * РЈРЅРёС‡С‚РѕР¶РёС‚СЊ
       */


      this.destroy = function () {
        network.clear();
        results = null;
      };
      /**
       * РЈСЃРїРµС€РЅРѕ, РµСЃС‚СЊ РґР°РЅРЅС‹Рµ
       * @param {Object} json
       */


      function success(json) {
        results = json;
        extractData(json);
        filter();
        append(filtred());
      }
      /**
       * РџРѕР»СѓС‡РёС‚СЊ РїРѕС‚РѕРєРё
       * @param {String} str
       * @param {Int} max_quality
       * @returns string
       */


      function extractData(json) {
        var last_episode = json.last_episode;
        var player_links = json.player_links; //JSON.parse(str).player_links;

        if (player_links.playlist && Object.keys(player_links.playlist).length > 0) {
            var season = 0;
            for( var keyp in player_links.playlist) {
                var playlist = player_links.playlist[keyp];
                ++season;
                var translation = 0;
                for( var keys in playlist) {
                    var seasons = playlist[keys];
                     ++translation;
                    var folder = [];
                    var episode = 0;
                    for( var keym in seasons) {
                    var movie = seasons[keym];
                        ++episode;

                        var qualities = movie.qualities.filter( function(elem) { return parseInt(elem) <= window.filmix.max_qualitie && parseInt(elem) !== 0 });
                        var qualitie = Math.max.apply(null, qualities);
                        var link = movie.link.replace('%s.mp4',qualitie+'.mp4');

                        var file = link.slice(1-link.length+link.lastIndexOf("/"));
                        var file_match = file.match(/s(\d+)e(\d+?)_\d+\.mp4/i);
                        if (file_match) {
                            season = parseInt(file_match[1]);
                            episode = parseInt(file_match[2]);
                        }

                        folder.push({
                            "id": season + '_' + episode,
                            "comment": episode + ' СЃРµСЂРёСЏ<br><i>' + keym + '</i>',
                            "file": link,
                            "episode": episode,
                            "season": season,
                            "quality": qualitie,
                            "qualities": qualities,
                            "translation": translation,
                        });
                    }

                    if (!extract[translation]) extract[translation] = { json : [], "file": "" };
                    extract[translation].json.push({
                        "id": season,
                        "comment": season + " СЃРµР·РѕРЅ",
                        "folder": folder,
                        "translation": translation,
                        });

                }
            }
        } else if (player_links.movie && player_links.movie.length > 0) {
            var translation = 0;
            for( var keym in player_links.movie) {
                var movie =  player_links.movie[keym];
                ++translation;

                var qualities = movie.link.match(/.+\[(.+[\d]),?\].+/i);
                if (qualities) qualities = qualities[1].split(",").filter( function (elem) { return parseInt(elem) <= window.filmix.max_qualitie && parseInt(elem) !== 0 });
                var qualitie = Math.max.apply(null, qualities);
                var link = movie.link.replace(/\[(.+[\d]),?\]/i, qualitie);

                extract[translation] = { json : {}, "file": link, translation : movie.translation, "quality": qualitie, "qualities": qualities };
            }
        }
      }
      /**
       * РќР°Р№С‚Рё РїРѕС‚РѕРє
       * @param {Object} element
       * @param {Int} max_quality
       * @returns string
       */


      function getFile(element, max_quality) {
        var translat = extract[element.translation];
        var id = element.season + '_' + element.episode;
        var file = '';
        var quality = false;
        var qualities =null;
        var cur_quality = max_quality;

        if (translat) {
          if (element.season) {
            for (var i in translat.json) {
              var elem = translat.json[i];

              if (elem.folder) {
                for (var f in elem.folder) {
                  var folder = elem.folder[f];

                  if (folder.id == id) {
                    file = folder.file;
                    qualities = folder.qualities;
                    break;
                  }
                }
              } else if (elem.id == id) {
                file = elem.file;
                qualities = elem.qualities;
                break;
              }
            }
          } else {
            file = translat.file;
            qualities = translat.qualities;
          }
        }

        max_quality = max_quality.split(' / ');
        if (max_quality.length > 1) {
            cur_quality = parseInt(max_quality[1]);
            max_quality = parseInt(max_quality[0]);
        } else {
            max_quality = cur_quality = parseInt(max_quality);
        }

        if (file) {
          var path = file.replace(max_quality+'.mp4', '');;

          if (max_quality !== cur_quality) {
              file = path + cur_quality + '.mp4';
          }

          quality = {};
          qualities.forEach(function (n) {
            quality[n + 'p'] = path + n + '.mp4';
          });
        }

        return {
          file: file,
          quality: quality
        };
      }
      /**
       * РџРѕСЃС‚СЂРѕРёС‚СЊ С„РёР»СЊС‚СЂ
       */


      function filter() {
        filter_items = {
          season: [],
          voice: [],
          voice_info: [],
          quality : []
        };

        if (!(results.last_episode && results.last_episode.season)) {
            var qualities = ['2160','1440','1080','720','480'];
            for( var key in extract) {
                if (extract[key].quality && parseInt(results.quality) < parseInt(extract[key].quality)) results.quality = extract[key].quality;
            }
            if (results.quality) {
                for( var key in qualities)
                    if (parseInt(results.quality) >= parseInt(qualities[key])) filter_items.quality.push(qualities[key]);
            }
            if (filter_items.quality.length == 0) filter_items.quality.push('720');
        }

        if (results.last_episode && results.last_episode.season) {
        var s = results.last_episode.season;

        while (s--) {
          filter_items.season.push('РЎРµР·РѕРЅ ' + (results.last_episode.season - s));
        }
        }
        var season = 0;
        for( var keyp in results.player_links.playlist) {
            var playlist = results.player_links.playlist[keyp];
            ++season;
            var translation = 0
            for( var keys in playlist) {
                var seasons = playlist[keys];
                ++translation;

                if (filter_items.voice.indexOf(keys) == -1) {
                    filter_items.voice.push(keys);
                    filter_items.voice_info.push({
                      id: translation
                    });
                }
            }
        }

        component.filter(filter_items, choice);
      }
      /**
       * РћС‚С„РёР»СЊС‚СЂРѕРІР°С‚СЊ С„Р°Р№Р»С‹
       * @returns array
       */


      function filtred() {
        var filtred = [];
        var filter_data = Lampa.Storage.get('online_filter', '{}');

        if (results.player_links.playlist && Object.keys(results.player_links.playlist).length > 0) {
          for( var keym in extract) {
            var movie = extract[keym];
            for( var keye in movie.json) {
              var episode = movie.json[keye];
              if (episode.id == filter_data.season + 1) {
                episode.folder.forEach( function (media) {
                  if (media.translation == filter_items.voice_info[filter_data.voice].id) {
                    filtred.push({
                      episode: parseInt(media.episode),
                      season: media.season,
                      title: media.episode + (media.title ? ' - ' + media.title : ''),
                      quality: media.quality + 'p',
                      translation: media.translation
                    });
                  }
                });
              }
            };
          };
        } else if (results.player_links.movie && results.player_links.movie.length > 0) {
          for( var keym in extract) {
            var movie = extract[keym];

            var select_quality = parseInt(filter_items.quality[filter_data.quality]);
            var qualities = movie.qualities.filter( function (elem) { return parseInt(elem) <= select_quality });
            var qualitie = Math.max.apply(null, qualities);
            if (qualitie) {
                filtred.push({
                    title: movie.translation,
                    quality: movie.quality + 'p / ' + qualitie + 'p',
                    translation: keym,
                });
            }
          };
        }
        return filtred;
      }
      /**
       * Р”РѕР±Р°РІРёС‚СЊ РІРёРґРµРѕ
       * @param {Array} items
       */


      function append(items) {
        component.reset();
        var viewed = Lampa.Storage.cache('online_view', 5000, []);
        items.forEach(function (element) {
          if (element.season) element.title = 'S' + element.season + ' / РЎРµСЂРёСЏ ' + element.title;
          element.info = element.season ? ' / ' + filter_items.voice[choice.voice] : '';
          var hash = Lampa.Utils.hash(element.season ? [element.season, element.episode, object.movie.original_title].join('') : object.movie.original_title);
          var view = Lampa.Timeline.view(hash);
          var item = Lampa.Template.get('online', element);
          var hash_file = Lampa.Utils.hash(element.season ? [element.season, element.episode, object.movie.original_title, filter_items.voice[choice.voice]].join('') : object.movie.original_title + element.title);
          item.addClass('video--stream');
          element.timeline = view;
          item.append(Lampa.Timeline.render(view));

          if (Lampa.Timeline.details) {
            item.find('.online__quality').append(Lampa.Timeline.details(view, ' / '));
          }

          if (viewed.indexOf(hash_file) !== -1) item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
          item.on('hover:enter', function () {
            if (object.movie.id) Lampa.Favorite.add('history', object.movie, 100);
            var extra = getFile(element, element.quality);

            if (extra.file) {
              var playlist = [];
              var first = {
                url: extra.file,
                quality: extra.quality,
                timeline: view,
                title: element.season ? element.title : object.movie.title + ' / ' + element.title
              };

              if (element.season) {
                items.forEach(function (elem) {
                  var ex = getFile(elem, elem.quality);
                  playlist.push({
                    title: elem.title,
                    url: ex.file,
                    quality: ex.quality,
                    timeline: elem.timeline
                  });
                });
              } else {
                playlist.push(first);
              }

              if (playlist.length > 1) first.playlist = playlist;
              Lampa.Player.play(first);
              Lampa.Player.playlist(playlist);
            } else Lampa.Noty.show('РќРµ СѓРґР°Р»РѕСЃСЊ РёР·РІР»РµС‡СЊ СЃСЃС‹Р»РєСѓ');
          });
          component.append(item);
          component.contextmenu({
            item: item,
            view: view,
            viewed: viewed,
            hash_file: hash_file,
            file: function file(call) {
              call(getFile(element, element.quality));
            }
          });
        });
        component.start(true);
      }
    };


    function component(object) {
      var network = new Lampa.Reguest();
      var scroll = new Lampa.Scroll({
        mask: true,
        over: true
      });
      var files = new Lampa.Files(object);
      var filter = new Lampa.Filter(object);
      var balanser = Lampa.Storage.get('online_balanser', 'filmix');
      var sources = {
        //videocdn: new videocdn(this, object),
        //rezka: new rezka(this, object),
        //kinobase: new kinobase(this, object),
        //collaps: new collaps(this, object),
        filmix: new filmix(this, object),
        //bazon: new bazon(this, object),
        //kholobok: new kholobok(this, object),
      };
      var last;
      var last_filter;
      var extended;
      var selected_id;
      var filter_translate = {
        season: 'РЎРµР·РѕРЅ',
        voice: 'РџРµСЂРµРІРѕРґ',
        source: 'РСЃС‚РѕС‡РЅРёРє',
        quality: 'РљР°С‡РµСЃС‚РІРѕ'
      };
      //var filter_sources = ['videocdn', 'rezka', 'kinobase', 'collaps']; // С€Р°Р»РѕРІР»РёРІС‹Рµ СЂСѓС‡РєРё
      //var filter_sources = ['filmix', 'bazon', 'kholobok']; // С€Р°Р»РѕРІР»РёРІС‹Рµ СЂСѓС‡РєРё
      var filter_sources = ['filmix']; // С€Р°Р»РѕРІР»РёРІС‹Рµ СЂСѓС‡РєРё

      if (filter_sources.indexOf(balanser) == -1) {
        balanser = 'filmix';
        Lampa.Storage.set('online_balanser', 'filmix');
      }

      scroll.minus();
      scroll.body().addClass('torrent-list');
      /**
       * РџРѕРґРіРѕС‚РѕРІРєР°
       */

      this.create = function () {
        var _this = this;

        this.activity.loader(true);
        Lampa.Background.immediately(Lampa.Utils.cardImgBackground(object.movie));

        filter.onSearch = function (value) {
          Lampa.Activity.replace({
            search: value,
            clarification: true
          });
        };

        filter.onBack = function () {
          _this.start();
        };

        filter.render().find('.selector').on('hover:focus', function (e) {
          last_filter = e.target;
        });

        filter.onSelect = function (type, a, b) {
          if (type == 'filter') {
            if (a.reset) {
              if (extended) sources[balanser].reset();else _this.start();
            } else {
              if (a.stype == 'source') {
                balanser = filter_sources[b.index];
                Lampa.Storage.set('online_balanser', balanser);

                _this.search();

                setTimeout(Lampa.Select.close, 10);
              } else {
                sources[balanser].filter(type, a, b);
              }
            }
          }
        };

        filter.render().find('.filter--sort').remove();
        filter.render();
        files.append(scroll.render());
        scroll.append(filter.render());
        this.search();
        return this.render();
      };
      /**
       * РќР°С‡Р°С‚СЊ РїРѕРёСЃРє
       */


      this.search = function () {
        this.activity.loader(true);
        this.filter({
          source: filter_sources
        }, {
          source: 0
        });
        this.reset();
        this.find();
      };

      this.find = function () {
        var _this2 = this;

        var prox = Lampa.Storage.field('proxy_other') === false ? '' : 'http://proxy.cub.watch/cdn/';
        var url = prox + 'https://videocdn.tv/api/short';
        var query = object.search;
        url = Lampa.Utils.addUrlComponent(url, 'api_token=3i40G5TSECmLF77oAqnEgbx61ZWaOYaE');
        //==>
        if (balanser == 'filmix')  url = Lampa.Utils.addUrlComponent( 'http://filmixapp.cyou/api/v2/suggest', 'word=' + encodeURIComponent(object.search));
        //<==
        var display = function display(json) {
          //==>
          if (balanser == 'filmix') {
            json.forEach(function(item) {
              item.filmId = item.id;
              item.year = item.alt_name.slice(-4);
            });

            var json_filter = json.filter(function (elem) {
              return elem.title == query;
            });
            if (json_filter && json_filter.length > 0) json.data = json_filter; else json.data = json;
          }
          //<==
          if (object.movie.imdb_id) {
            var imdb = json.data.filter(function (elem) {
              return elem.imdb_id == object.movie.imdb_id;
            });
            if (imdb.length) json.data = imdb;
          }

          if (json.data && json.data.length) {
            //if (json.data.length == 1 || object.clarification) {
            if (json.data.length == 1 || ( object.clarification && json.data.length == 1 ) ) {
              _this2.extendChoice();

              if (balanser == 'videocdn') sources[balanser].search(object, json.data);else sources[balanser].search(object, json.data[0].kp_id || json.data[0].filmId, json.data);
            } else {
              _this2.similars(json.data);

              _this2.loading(false);
            }
          } else _this2.empty('РџРѕ Р·Р°РїСЂРѕСЃСѓ (' + query + ') РЅРµС‚ СЂРµР·СѓР»СЊС‚Р°С‚РѕРІ');
        };

        var pillow = function pillow(a, c) {
          network.timeout(1000 * 15);

          //if (balanser !== 'videocdn') {
          if (balanser !== 'videocdn' && balanser !== 'filmix') {
            network["native"]('https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=' + encodeURIComponent(query), function (json) {
              json.data = json.films;
              display(json);
            }, function (a, c) {
              _this2.empty(network.errorDecode(a, c));
            }, false, {
              headers: {
                'X-API-KEY': '2d55adfd-019d-4567-bbf7-67d503f61b5a'
              }
            });
          } else {
            _this2.empty(network.errorDecode(a, c));
          }
        };

        var letgo = function letgo(imdb_id) {
          var url_end = Lampa.Utils.addUrlComponent(url, imdb_id ? 'imdb_id=' + encodeURIComponent(imdb_id) : 'title=' + encodeURIComponent(query));
          network.timeout(1000 * 15);
          network["native"](url_end, function (json) {
            if (json.data && json.data.length) display(json);else {
              network["native"](Lampa.Utils.addUrlComponent(url, 'title=' + encodeURIComponent(query)), display.bind(_this2), pillow.bind(_this2));
            }
          }, pillow.bind(_this2));
        };

        network.clear();
        network.timeout(1000 * 15);

        if (object.movie.imdb_id) {
          letgo(object.movie.imdb_id);
        } else if (object.movie.source == 'tmdb' || object.movie.source == 'cub') {
          network["native"]('http://' + (Lampa.Storage.field('proxy_tmdb') === false ? 'api.themoviedb.org' : 'apitmdb.cub.watch') + '/3/' + (object.movie.name ? 'tv' : 'movie') + '/' + object.movie.id + '/external_ids?api_key=4ef0d7355d9ffb5151e987764708ce96&language=ru', function (ttid) {
            letgo(ttid.imdb_id);
          }, function (a, c) {
            _this2.empty(network.errorDecode(a, c));
          });
        } else {
          letgo();
        }
      };

      this.extendChoice = function () {
        var data = Lampa.Storage.cache('online_choice_' + balanser, 500, {});
        var save = data[selected_id || object.movie.id] || {};
        extended = true;
        sources[balanser].extendChoice(save);
      };

      this.saveChoice = function (choice) {
        var data = Lampa.Storage.cache('online_choice_' + balanser, 500, {});
        data[selected_id || object.movie.id] = choice;
        Lampa.Storage.set('online_choice_' + balanser, data);
      };
      /**
       * Р•СЃС‚СЊ РїРѕС…РѕР¶РёРµ РєР°СЂС‚РѕС‡РєРё
       * @param {Object} json
       */


      this.similars = function (json) {
        var _this3 = this;

        json.forEach(function (elem) {
          var year = elem.start_date || elem.year || '';
          elem.title = elem.title || elem.ru_title || elem.nameRu;
          elem.quality = year ? (year + '').slice(0, 4) : '----';
          elem.info = '';
          var item = Lampa.Template.get('online_folder', elem);
          item.on('hover:enter', function () {
            _this3.activity.loader(true);

            _this3.reset();

            object.search_date = year;
            selected_id = elem.id;

            _this3.extendChoice();

            if (balanser == 'videocdn') sources[balanser].search(object, [elem]);else sources[balanser].search(object, elem.kp_id || elem.filmId);
          });

          _this3.append(item);
        });
      };
      /**
       * РћС‡РёСЃС‚РёС‚СЊ СЃРїРёСЃРѕРє С„Р°Р№Р»РѕРІ
       */


      this.reset = function () {
        last = false;
        scroll.render().find('.empty').remove();
        filter.render().detach();
        scroll.clear();
        scroll.append(filter.render());
      };
      /**
       * Р—Р°РіСЂСѓР·РєР°
       */


      this.loading = function (status) {
        if (status) this.activity.loader(true);else {
          this.activity.loader(false);
          this.activity.toggle();
        }
      };
      /**
       * РџРѕСЃС‚СЂРѕРёС‚СЊ С„РёР»СЊС‚СЂ
       */


      this.filter = function (filter_items, choice) {
        var select = [];

        var add = function add(type, title) {
          var need = Lampa.Storage.get('online_filter', '{}');
          var items = filter_items[type];
          var subitems = [];
          var value = need[type];
          items.forEach(function (name, i) {
            subitems.push({
              title: name,
              selected: value == i,
              index: i
            });
          });
          select.push({
            title: title,
            subtitle: items[value],
            items: subitems,
            stype: type
          });
        };

        filter_items.source = filter_sources;
        choice.source = filter_sources.indexOf(balanser);
        select.push({
          title: 'РЎР±СЂРѕСЃРёС‚СЊ С„РёР»СЊС‚СЂ',
          reset: true
        });
        Lampa.Storage.set('online_filter', choice);
        if (filter_items.voice && filter_items.voice.length) add('voice', 'РџРµСЂРµРІРѕРґ');
        if (filter_items.season && filter_items.season.length) add('season', 'РЎРµР·РѕРЅ');
        if (filter_items.quality && filter_items.quality.length) add('quality', 'РљР°С‡РµСЃС‚РІРѕ');
        add('source', 'РСЃС‚РѕС‡РЅРёРє');
        filter.set('filter', select);
        this.selected(filter_items);
      };
      /**
       * Р—Р°РєСЂС‹С‚СЊ С„РёР»СЊС‚СЂ
       */


      this.closeFilter = function () {
        if ($('body').hasClass('selectbox--open')) Lampa.Select.close();
      };
      /**
       * РџРѕРєР°Р·Р°С‚СЊ С‡С‚Рѕ РІС‹Р±СЂР°РЅРѕ РІ С„РёР»СЊС‚СЂРµ
       */


      this.selected = function (filter_items) {
        var need = Lampa.Storage.get('online_filter', '{}'),
            select = [];

        for (var i in need) {
          if (filter_items[i] && filter_items[i].length) {
            if (i == 'voice' || i == 'source') {
              select.push(filter_translate[i] + ': ' + filter_items[i][need[i]]);
            } else {
              if (filter_items.season.length >= 1) {
                select.push(filter_translate.season + ': ' + filter_items[i][need[i]]);
              }
            }
          }
        }

        filter.chosen('filter', select);
      };
      /**
       * Р”РѕР±Р°РІРёС‚СЊ С„Р°Р№Р»
       */


      this.append = function (item) {
        item.on('hover:focus', function (e) {
          last = e.target;
          scroll.update($(e.target), true);
        });
        scroll.append(item);
      };
      /**
       * РњРµРЅСЋ
       */


      this.contextmenu = function (params) {
        params.item.on('hover:long', function () {
          function show(extra) {
            var enabled = Lampa.Controller.enabled().name;
            var menu = [{
              title: 'РџРѕРјРµС‚РёС‚СЊ',
              mark: true
            }, {
              title: 'РЎРЅСЏС‚СЊ РѕС‚РјРµС‚РєСѓ',
              clearmark: true
            }, {
              title: 'РЎР±СЂРѕСЃРёС‚СЊ С‚Р°Р№РјРєРѕРґ',
              timeclear: true
            }];

            if (Lampa.Platform.is('webos')) {
              menu.push({
                title: 'Р—Р°РїСѓСЃС‚РёС‚СЊ РїР»РµРµСЂ - Webos',
                player: 'webos'
              });
            }

            if (Lampa.Platform.is('android')) {
              menu.push({
                title: 'Р—Р°РїСѓСЃС‚РёС‚СЊ РїР»РµРµСЂ - Android',
                player: 'android'
              });
            }

            menu.push({
              title: 'Р—Р°РїСѓСЃС‚РёС‚СЊ РїР»РµРµСЂ - Lampa',
              player: 'lampa'
            });

            if (extra) {
              menu.push({
                title: 'РљРѕРїРёСЂРѕРІР°С‚СЊ СЃСЃС‹Р»РєСѓ РЅР° РІРёРґРµРѕ',
                copylink: true
              });
            }

            Lampa.Select.show({
              title: 'Р”РµР№СЃС‚РІРёРµ',
              items: menu,
              onBack: function onBack() {
                Lampa.Controller.toggle(enabled);
              },
              onSelect: function onSelect(a) {
                if (a.clearmark) {
                  Lampa.Arrays.remove(params.viewed, params.hash_file);
                  Lampa.Storage.set('online_view', params.viewed);
                  params.item.find('.torrent-item__viewed').remove();
                }

                if (a.mark) {
                  if (params.viewed.indexOf(params.hash_file) == -1) {
                    params.viewed.push(params.hash_file);
                    params.item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
                    Lampa.Storage.set('online_view', params.viewed);
                  }
                }

                if (a.timeclear) {
                  params.view.percent = 0;
                  params.view.time = 0;
                  params.view.duration = 0;
                  Lampa.Timeline.update(params.view);
                }

                Lampa.Controller.toggle(enabled);

                if (a.player) {
                  Lampa.Player.runas(a.player);
                  params.item.trigger('hover:enter');
                }

                if (a.copylink) {
                  if (extra.quality) {
                    var qual = [];

                    for (var i in extra.quality) {
                      qual.push({
                        title: i,
                        file: extra.quality[i]
                      });
                    }

                    Lampa.Select.show({
                      title: 'РЎСЃС‹Р»РєРё',
                      items: qual,
                      onBack: function onBack() {
                        Lampa.Controller.toggle(enabled);
                      },
                      onSelect: function onSelect(b) {
                        Lampa.Utils.copyTextToClipboard(b.file, function () {
                          Lampa.Noty.show('РЎСЃС‹Р»РєР° СЃРєРѕРїРёСЂРѕРІР°РЅР° РІ Р±СѓС„РµСЂ РѕР±РјРµРЅР°');
                        }, function () {
                          Lampa.Noty.show('РћС€РёР±РєР° РїСЂРё РєРѕРїРёСЂРѕРІР°РЅРёРµ СЃСЃС‹Р»РєРё');
                        });
                      }
                    });
                  } else {
                    Lampa.Utils.copyTextToClipboard(extra.file, function () {
                      Lampa.Noty.show('РЎСЃС‹Р»РєР° СЃРєРѕРїРёСЂРѕРІР°РЅР° РІ Р±СѓС„РµСЂ РѕР±РјРµРЅР°');
                    }, function () {
                      Lampa.Noty.show('РћС€РёР±РєР° РїСЂРё РєРѕРїРёСЂРѕРІР°РЅРёРµ СЃСЃС‹Р»РєРё');
                    });
                  }
                }
              }
            });
          }

          params.file(show);
        }).on('hover:focus', function () {
          if (Lampa.Helper) Lampa.Helper.show('online_file', 'РЈРґРµСЂР¶РёРІР°Р№С‚Рµ РєР»Р°РІРёС€Сѓ (РћРљ) РґР»СЏ РІС‹Р·РѕРІР° РєРѕРЅС‚РµРєСЃС‚РЅРѕРіРѕ РјРµРЅСЋ', params.item);
        });
      };
      /**
       * РџРѕРєР°Р·Р°С‚СЊ РїСѓСЃС‚РѕР№ СЂРµР·СѓР»СЊС‚Р°С‚
       */


      this.empty = function (msg) {
        var empty = Lampa.Template.get('list_empty');
        if (msg) empty.find('.empty__descr').text(msg);
        scroll.append(empty);
        this.loading(false);
      };
      /**
       * РќР°С‡Р°С‚СЊ РЅР°РІРёРіР°С†РёСЋ РїРѕ С„Р°Р№Р»Р°Рј
       */


      this.start = function (first_select) {
        if (first_select) {
          last = scroll.render().find('.selector').eq(2)[0];
        }

        Lampa.Controller.add('content', {
          toggle: function toggle() {
            Lampa.Controller.collectionSet(scroll.render(), files.render());
            Lampa.Controller.collectionFocus(last || false, scroll.render());
          },
          up: function up() {
            if (Navigator.canmove('up')) {
              if (scroll.render().find('.selector').slice(2).index(last) == 0 && last_filter) {
                Lampa.Controller.collectionFocus(last_filter, scroll.render());
              } else Navigator.move('up');
            } else Lampa.Controller.toggle('head');
          },
          down: function down() {
            Navigator.move('down');
          },
          right: function right() {
            if (Navigator.canmove('right')) Navigator.move('right');else filter.show('Р¤РёР»СЊС‚СЂ', 'filter');
          },
          left: function left() {
            if (Navigator.canmove('left')) Navigator.move('left');else Lampa.Controller.toggle('menu');
          },
          back: this.back
        });
        Lampa.Controller.toggle('content');
      };

      this.render = function () {
        return files.render();
      };

      this.back = function () {
        Lampa.Activity.backward();
      };

      this.pause = function () {};

      this.stop = function () {};

      this.destroy = function () {
        network.clear();
        files.destroy();
        scroll.destroy();
        network = null;
        //sources.videocdn.destroy();
        //sources.rezka.destroy();
        //sources.kinobase.destroy();
        //sources.collaps.destroy();
        sources.filmix.destroy();
        //sources.bazon.destroy();
        //sources.kholobok.destroy();
      };
    }

    function resetTemplates() {
      Lampa.Template.add('online', "<div class=\"online selector\">\n        <div class=\"online__body\">\n            <div style=\"position: absolute;left: 0;top: -0.3em;width: 2.4em;height: 2.4em\">\n                <svg style=\"height: 2.4em; width:  2.4em;\" viewBox=\"0 0 128 128\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <circle cx=\"64\" cy=\"64\" r=\"56\" stroke=\"white\" stroke-width=\"16\"/>\n                    <path d=\"M90.5 64.3827L50 87.7654L50 41L90.5 64.3827Z\" fill=\"white\"/>\n                </svg>\n            </div>\n            <div class=\"online__title\" style=\"padding-left: 2.1em;\">{title}</div>\n            <div class=\"online__quality\" style=\"padding-left: 3.4em;\">{quality}{info}</div>\n        </div>\n    </div>");
      Lampa.Template.add('online_folder', "<div class=\"online selector\">\n        <div class=\"online__body\">\n            <div style=\"position: absolute;left: 0;top: -0.3em;width: 2.4em;height: 2.4em\">\n                <svg style=\"height: 2.4em; width:  2.4em;\" viewBox=\"0 0 128 112\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <rect y=\"20\" width=\"128\" height=\"92\" rx=\"13\" fill=\"white\"/>\n                    <path d=\"M29.9963 8H98.0037C96.0446 3.3021 91.4079 0 86 0H42C36.5921 0 31.9555 3.3021 29.9963 8Z\" fill=\"white\" fill-opacity=\"0.23\"/>\n                    <rect x=\"11\" y=\"8\" width=\"106\" height=\"76\" rx=\"13\" fill=\"white\" fill-opacity=\"0.51\"/>\n                </svg>\n            </div>\n            <div class=\"online__title\" style=\"padding-left: 2.1em;\">{title}</div>\n            <div class=\"online__quality\" style=\"padding-left: 3.4em;\">{quality}{info}</div>\n        </div>\n    </div>");
    }

    var button = "<div class=\"full-start__button selector view--online\" data-subtitle=\"РСЃС‚РѕС‡РЅРёРє Filmix\">\n    <svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns:svgjs=\"http://svgjs.com/svgjs\" version=\"1.1\" width=\"512\" height=\"512\" x=\"0\" y=\"0\" viewBox=\"0 0 30.051 30.051\" style=\"enable-background:new 0 0 512 512\" xml:space=\"preserve\" class=\"\">\n    <g xmlns=\"http://www.w3.org/2000/svg\">\n        <path d=\"M19.982,14.438l-6.24-4.536c-0.229-0.166-0.533-0.191-0.784-0.062c-0.253,0.128-0.411,0.388-0.411,0.669v9.069   c0,0.284,0.158,0.543,0.411,0.671c0.107,0.054,0.224,0.081,0.342,0.081c0.154,0,0.31-0.049,0.442-0.146l6.24-4.532   c0.197-0.145,0.312-0.369,0.312-0.607C20.295,14.803,20.177,14.58,19.982,14.438z\" fill=\"currentColor\"/>\n        <path d=\"M15.026,0.002C6.726,0.002,0,6.728,0,15.028c0,8.297,6.726,15.021,15.026,15.021c8.298,0,15.025-6.725,15.025-15.021   C30.052,6.728,23.324,0.002,15.026,0.002z M15.026,27.542c-6.912,0-12.516-5.601-12.516-12.514c0-6.91,5.604-12.518,12.516-12.518   c6.911,0,12.514,5.607,12.514,12.518C27.541,21.941,21.937,27.542,15.026,27.542z\" fill=\"currentColor\"/>\n    </g></svg>\n\n    <span>Filmix</span>\n    </div>"; // РЅСѓР¶РЅР° Р·Р°РіР»СѓС€РєР°, Р° С‚Рѕ РїСЂРё СЃС‚СЂР°С‚Рµ Р»Р°РјРїС‹ РіРѕРІРѕСЂРёС‚ РїСѓСЃС‚Рѕ

    Lampa.Component.add('online_ext', component); //С‚Рѕ Р¶Рµ СЃР°РјРѕРµ

    resetTemplates();
    Lampa.Listener.follow('full', function (e) {
      if (e.type == 'complite') {
        var btn = $(button);
        btn.on('hover:enter', function () {
          resetTemplates();
          Lampa.Component.add('online_ext', component);
          Lampa.Activity.push({
            url: '',
            title: 'Filmix',
            component: 'online_ext',
            search: e.data.movie.title,
            search_one: e.data.movie.title,
            search_two: e.data.movie.original_title,
            movie: e.data.movie,
            page: 1
          });
        });
        e.object.activity.render().find('.view--torrent').after(btn);
      }
    });

})();