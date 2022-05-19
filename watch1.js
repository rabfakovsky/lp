(function () {
	'use strict';

	function VideoCDN(component, _object) {
		var network = new Lampa.Reguest();
		var extract = {};
		var results = [];
		var object = _object;
		var filter_items = {};
		var choice = {
			season: 0,
			voice: 0
		};
		/**
		 * РќР°С‡Р°С‚СЊ РїРѕРёСЃРє
		 * @param {Object} _object 
		 */
		this.search = function (_object, data) {
			object = _object;
			var url = 'http://cdn.svetacdn.in/api/';
			var itm = data[0];
			if (itm) {
				var type = itm.iframe_src ? itm.iframe_src.split('/').slice(-2)[0] : data[0].type;
				if (type == 'movie' || type == 'FILM') type = 'movies';
				var query = data[0].type == 'FILM' ? data[0].nameRu : itm.title;
				url += type;
				url = Lampa.Utils.addUrlComponent(url, 'api_token=W2NvL86a34Kg2oJXMTf8q67gsgkKuzap');
				url = Lampa.Utils.addUrlComponent(url, itm.imdb_id ? 'imdb_id=' + encodeURIComponent(itm.imdb_id) : 'title=' + encodeURIComponent(object.search));
				url = Lampa.Utils.addUrlComponent(url, 'field=' + encodeURIComponent('global'));
				network.silent(url, function (found) {
					results = found.data.filter(function (elem) {
						return elem.id == itm.id;
					});
					success(data[0].type == 'FILM' ? found.data : results);
					component.loading(false);
					if (!results.length) component.empty('РџРѕ Р·Р°РїСЂРѕСЃСѓ (' + query + ') РЅРµС‚ СЂРµР·СѓР»СЊС‚Р°С‚РѕРІ');
				}, function () {
					component.empty();
				});
			} else component.empty('РџРѕ Р·Р°РїСЂРѕСЃСѓ (' + object.search + ') РЅРёС‡РµРіРѕ РЅРµ РЅР°С€Р»Рё');
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
				voice: 0
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
		function extractFile(str, max_quality) {
			var url = '';
			try {
				var items = str.split(',').map(function (item) {
					return {
						quality: parseInt(item.match(/\[(\d+)p\]/)[1]),
						file: item.replace(/\[\d+p\]/, '').split(' or ')[0]
					};
				});
				items.sort(function (a, b) {
					return b.quality - a.quality;
				});
				url = items[0].file;
				url = 'http:' + url.slice(0, url.lastIndexOf('/')) + '/' + (max_quality || items[0].quality) + '.mp4';
			} catch (e) {}
			return url;
		}
		/**
		 * РџРѕР»СѓС‡РёС‚СЊ РёРЅС„РѕСЂРјР°С†РёСЋ Рѕ С„РёР»СЊРјРµ
		 * @param {Arrays} results 
		 */
		function extractData(results) {
			network.timeout(5000);
			var movie = results.slice(0, 1)[0];
			extract = {};
			if (movie) {
				var src = movie.iframe_src;
				network["native"]('http:' + src, function (raw) {
					var math = raw.replace(/\n/g, '').match(/id="files" value="(.*?)"/);
					if (math) {
						var json = Lampa.Arrays.decodeJson(math[1].replace(/&quot;/g, '"'), {});
						var text = document.createElement("textarea");
						var _loop = function _loop(i) {
							var _movie$media, _movie$media$filter$;
							if (0 === i - 0) {
								return "continue";
							}
							text.innerHTML = json[i];
							Lampa.Arrays.decodeJson(text.value, {});
							var max_quality = (_movie$media = movie.media) === null || _movie$media === void 0 ? void 0 : (_movie$media$filter$ = _movie$media.filter(function (obj) {
								return obj.translation_id === i - 0;
							})[0]) === null || _movie$media$filter$ === void 0 ? void 0 : _movie$media$filter$.max_quality;
							if (!max_quality) {
								var _movie$translations, _movie$translations$f;
								max_quality = (_movie$translations = movie.translations) === null || _movie$translations === void 0 ? void 0 : (_movie$translations$f = _movie$translations.filter(function (obj) {
									return obj.id === i - 0;
								})[0]) === null || _movie$translations$f === void 0 ? void 0 : _movie$translations$f.max_quality;
							}
							extract[i] = {
								json: Lampa.Arrays.decodeJson(text.value, {}),
								file: extractFile(json[i], max_quality)
							};
							for (var a in extract[i].json) {
								var elem = extract[i].json[a];
								if (elem.folder) {
									for (var f in elem.folder) {
										var folder = elem.folder[f];
										folder.file = extractFile(folder.file, max_quality);
									}
								} else elem.file = extractFile(elem.file, max_quality);
							}
						};
						for (var i in json) {
							var _ret = _loop(i);
							if (_ret === "continue") continue;
						}
					}
				}, false, false, {
					dataType: 'text'
				});
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
			if (translat) {
				if (element.season) {
					for (var i in translat.json) {
						var elem = translat.json[i];
						if (elem.folder) {
							for (var f in elem.folder) {
								var folder = elem.folder[f];
								if (folder.id == id) {
									file = folder.file;
									break;
								}
							}
						} else if (elem.id == id) {
							file = elem.file;
							break;
						}
					}
				} else {
					file = translat.file;
				}
			}
			max_quality = parseInt(max_quality);
			if (file) {
				var path = file.slice(0, file.lastIndexOf('/')) + '/';
				if (file.split('/').pop().replace('.mp4', '') !== max_quality) {
					file = path + max_quality + '.mp4';
				}
				quality = {};
				var mass = [1080, 720, 480, 360];
				mass = mass.slice(mass.indexOf(max_quality));
				mass.forEach(function (n) {
					quality[n + 'p'] = path + n + '.mp4';
				});
				var preferably = Lampa.Storage.get('video_quality_default', '1080') + 'p';
				if (quality[preferably]) file = quality[preferably];
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
				voice_info: []
			};
			results.slice(0, 1).forEach(function (movie) {
				if (movie.season_count) {
					var s = movie.season_count;
					while (s--) {
						filter_items.season.push('РЎРµР·РѕРЅ ' + (movie.season_count - s));
					}
				}
				if (filter_items.season.length) {
					movie.episodes.forEach(function (episode) {
						if (episode.season_num == choice.season + 1) {
							episode.media.forEach(function (media) {
								if (filter_items.voice.indexOf(media.translation.smart_title) == -1) {
									filter_items.voice.push(media.translation.smart_title);
									filter_items.voice_info.push({
										id: media.translation.id
									});
								}
							});
						}
					});
				}
			});
			component.filter(filter_items, choice);
		}
		/**
		 * РћС‚С„РёР»СЊС‚СЂРѕРІР°С‚СЊ С„Р°Р№Р»С‹
		 * @returns array
		 */
		function filtred() {
			var filtred = [];
			var filter_data = Lampa.Storage.get('online_filter', '{}');
			if (results.slice(0, 1)[0].episodes || object.movie.number_of_seasons) {
				results.slice(0, 1).forEach(function (movie) {
					movie.episodes.forEach(function (episode) {
						if (episode.season_num == filter_data.season + 1) {
							episode.media.forEach(function (media) {
								if (media.translation.id == filter_items.voice_info[filter_data.voice].id) {
									filtred.push({
										episode: parseInt(episode.num),
										season: episode.season_num,
										title: episode.num + ' - ' + episode.ru_title,
										quality: media.max_quality + 'p',
										translation: media.translation_id
									});
								}
							});
						}
					});
				});
			} else {
				results.slice(0, 1).forEach(function (movie) {
					movie.media.forEach(function (element) {
						filtred.push({
							title: element.translation.title,
							quality: element.max_quality + 'p' + (element.source_quality ? ' - ' + element.source_quality.toUpperCase() : ''),
							translation: element.translation_id
						});
					});
				});
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
				var item = Lampa.Template.get('onlines_v1', element);
				var hash_file = Lampa.Utils.hash(element.season ? [element.season, element.episode, object.movie.original_title, filter_items.voice[choice.voice]].join('') : object.movie.original_title + element.title);
				item.addClass('video--stream');
				element.timeline = view;
				item.append(Lampa.Timeline.render(view));
				if (Lampa.Timeline.details) {
					item.find('.online__quality').append(Lampa.Timeline.details(view, ' / '));
				}
				if (viewed.indexOf(hash_file) !== -1) item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');

				function contextmenu() {
					component.contextmenu({
						item: item,
						view: view,
						viewed: viewed,
						hash_file: hash_file,
						file: function file(call) {
							call(getFile(element, element.quality));
						}
					});
				}
				var dbtimer,
					dbtime = Date.now();
				item.on('hover:enter', function () {
					if (dbtime < Date.now() - 200) {
						dbtimer = setTimeout(function () {
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
								} else playlist.push(first);
								if (playlist.length > 1) first.playlist = playlist;
								Lampa.Player.play(first);
								Lampa.Player.playlist(playlist);
								if (viewed.indexOf(hash_file) == -1) {
									viewed.push(hash_file);
									item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
									Lampa.Storage.set('online_view', viewed);
									component.new_seria();
								}
							} else Lampa.Noty.show('РќРµ СѓРґР°Р»РѕСЃСЊ РёР·РІР»РµС‡СЊ СЃСЃС‹Р»РєСѓ');
						}, 200);
						dbtime = Date.now() + 200;
					} else if (dbtime > Date.now()) {
						clearTimeout(dbtimer);
						contextmenu();
					}
				}).on('hover:long', function () {
					contextmenu();
				}).on('hover:focus', function () {
					if (Lampa.Helper) Lampa.Helper.show('online_file', 'РЈРґРµСЂР¶РёРІР°Р№С‚Рµ РєР»Р°РІРёС€Сѓ (РћРљ) РґР»СЏ РІС‹Р·РѕРІР° РєРѕРЅС‚РµРєСЃС‚РЅРѕРіРѕ РјРµРЅСЋ', item);
				});
				component.append(item);
			});
			component.start(true);
		}
	}

	function HDRezka(component, _object) {
		var network = new Lampa.Reguest();
		var extract = {};
		var embed = Lampa.Storage.field('proxy_other') === false ? 'https://voidboost.net/' : Lampa.Storage.field('proxy_other') == true && Lampa.Platform.tv() ? 'http://arkmv.ru/rezka/' : 'https://voidboost.net/';
		var object = _object;
		var select_title = '';
		var select_id = '';
		var filter_items = {};
		var choice = {
			season: 0,
			voice: 0
		};
		/**
		 * РџРѕРёСЃРє
		 * @param {Object} _object 
		 */
		this.search = function (_object, kinopoisk_id) {
			object = _object;
			select_id = kinopoisk_id;
			select_title = object.search;
			getFirstTranlate(kinopoisk_id, function (voice) {
				getFilm(kinopoisk_id, voice);
			});
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
				voice: 0
			};
			component.loading(true);
			getFilm(select_id);
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
			component.loading(true);
			choice.voice_token = extract.voice[choice.voice].token;
			getFilm(select_id, choice.voice_token);
			component.saveChoice(choice);
			setTimeout(component.closeFilter, 10);
		};
		/**
		 * РЈРЅРёС‡С‚РѕР¶РёС‚СЊ
		 */
		this.destroy = function () {
			network.clear();
			extract = null;
		};

		function getSeasons(voice, call) {
			var url = embed + 'serial/' + voice + '/iframe?h=gidonline.io';
			network.clear();
			network.timeout(10000);
			network["native"](url, function (str) {
				extractData(str);
				call();
			}, function (a, c) {
				component.empty(network.errorDecode(a, c));
			}, false, {
				dataType: 'text'
			});
		}

		function getChoiceVoice() {
			var res = extract.voice[0];
			if (choice.voice_token) {
				extract.voice.forEach(function (voice) {
					if (voice.token === choice.voice_token) res = voice;
				});
			}
			return res;
		}

		function getFirstTranlate(id, call) {
			network.clear();
			network.timeout(10000);
			network["native"](embed + 'embed/' + id, function (str) {
				extractData(str);
				if (extract.voice.length) call(getChoiceVoice().token);
				else component.empty('РџРѕ Р·Р°РїСЂРѕСЃСѓ (' + select_title + ') РЅРёС‡РµРіРѕ РЅРµ РЅР°Р№РґРµРЅРѕ');
			}, function (a, c) {
				component.empty(network.errorDecode(a, c));
			}, false, {
				dataType: 'text'
			});
		}

		function getEmbed(url) {
			network.clear();
			network.timeout(10000);
			network["native"](url, function (str) {
				component.loading(false);
				extractData(str);
				filter();
				append();
			}, function (a, c) {
				component.empty(network.errorDecode(a, c));
			}, false, {
				dataType: 'text'
			});
		}
		/**
		 * Р—Р°РїСЂРѕСЃРёС‚СЊ С„РёР»СЊРј
		 * @param {Int} id 
		 * @param {String} voice 
		 */
		function getFilm(id, voice) {
			network.clear();
			network.timeout(10000);
			var url = embed;
			if (voice) {
				if (extract.season.length) {
					var ses = extract.season[Math.min(extract.season.length - 1, choice.season)].id;
					url += 'serial/' + voice + '/iframe?s=' + ses + '&h=gidonline.io';
					return getSeasons(voice, function () {
						var check = extract.season.filter(function (s) {
							return s.id == ses;
						});
						if (!check.length) {
							choice.season = extract.season.length - 1;
							url = embed + 'serial/' + voice + '/iframe?s=' + extract.season[Math.min(extract.season.length - 1, choice.season)].id + '&h=gidonline.io';
						}
						getEmbed(url);
					});
				} else {
					url += 'movie/' + voice + '/iframe?h=gidonline.io';
					getEmbed(url);
				}
			} else {
				url += 'embed/' + id;
				getEmbed(url);
			}
		}
		/**
		 * РџРѕСЃС‚СЂРѕРёС‚СЊ С„РёР»СЊС‚СЂ
		 */
		function filter() {
			filter_items = {
				season: extract.season.map(function (v) {
					return v.name;
				}),
				voice: extract.season.length ? extract.voice.map(function (v) {
					return v.name;
				}) : []
			};
			component.filter(filter_items, choice);
		}
		/**
		 * РџРѕР»СѓС‡РёС‚СЊ РїРѕС‚РѕРє
		 * @param {*} element 
		 */
		function parseSubtitles(str) {
			var subtitle = str.match("subtitle': '(.*?)'");
			if (subtitle) {
				var index = -1;
				return subtitle[1].split(',').map(function (sb) {
					var sp = sb.split(']');
					index++;
					return {
						label: sp[0].slice(1),
						url: sp.pop(),
						index: index
					};
				});
			}
		}

		function getStream(element, call, error) {
			if (element.stream) return call(element.stream);
			var url = embed;
			if (element.season) {
				url += 'serial/' + element.voice.token + '/iframe?s=' + element.season + '&e=' + element.episode + '&h=gidonline.io'
			} else {
				url += 'movie/' + element.voice.token + '/iframe?h=gidonline.io';
			}
			network.clear();
			network.timeout(3000);
			network["native"](url, function (str) {
				var videos = str.match("file': '(.*?)'");
				if (videos) {
					var video = decode(videos[1]),
						qused = '',
						first = '',
						mass = ['2160p', '1440p', '1080p Ultra', '1080p', '720p', '480p', '360p']; //СѓС…РЅСЏ С‚СѓС‚ РїСЂРѕРёСЃС…РѕРґРёС‚, С…СЂРµРЅ Р·РЅР°РµС‚ РїРѕС‡РµРјСѓ РїРѕСЃР»Рµ .join() РІРѕР·РІСЂРѕС€Р°РµС‚ С‚РѕР»СЊРєРѕ РїРѕСЃР»РµРґРЅРёСЋ СЃСЃС‹Р»РєСѓ
					video = video.slice(1).split(/,\[/).map(function (s) {
						return s.split(']')[0] + ']' + (s.indexOf(' or ') > -1 ? s.split(' or ').pop().trim() : s.split(']').pop());
					}).join('[');
					element.qualitys = {};
					var preferably = Lampa.Storage.get('video_quality_default', '1080');
					mass.forEach(function (n) {
						var link = video.match(new RegExp(n + "](.*?)mp4"));
						if (link) {
							if (!first) first = link[1] + 'mp4';
							element.qualitys[n] = link[1] + 'mp4';
							if (n.indexOf(preferably) >= 0) {
								qused = link[1] + 'mp4';
								first = qused;
							}
						}
					});
					if (!first) element.qualitys = false;
					if (first) {
						element.stream = qused || first;
						element.subtitles = parseSubtitles(str);
						call(element.stream);
					} else error();
				} else error();
			}, error, false, {
				dataType: 'text'
			});
		}

		function decode(data) {
			function product(iterables, repeat) {
				var argv = Array.prototype.slice.call(arguments),
					argc = argv.length;
				if (argc === 2 && !isNaN(argv[argc - 1])) {
					var copies = [];
					for (var i = 0; i < argv[argc - 1]; i++) {
						copies.push(argv[0].slice()); // Clone
					}
					argv = copies;
				}
				return argv.reduce(function tl(accumulator, value) {
					var tmp = [];
					accumulator.forEach(function (a0) {
						value.forEach(function (a1) {
							tmp.push(a0.concat(a1));
						});
					});
					return tmp;
				}, [
					[]
				]);
			}

			function unite(arr) {
				var _final = [];
				arr.forEach(function (e) {
					_final.push(e.join(""));
				});
				return _final;
			}
			var trashList = ["@", "#", "!", "^", "$"];
			var two = unite(product(trashList, 2));
			var tree = unite(product(trashList, 3));
			var trashCodesSet = two.concat(tree);
			var arr = data.replace("#h", "").split("//_//");
			var trashString = arr.join('');
			trashCodesSet.forEach(function (i) {
				trashString = trashString.replace(new RegExp(btoa(i), 'g'), '');
			});
			var result = '';
			try {
				result = atob(trashString.substr(2));
			} catch (e) {}
			return result;
		}
		/*
		function decode(x){
		    var file = x.replace('JCQkIyMjIyEhISEhISE=', '')
		   .replace('QCMhQEBAIyMkJEBA', '')
		   .replace('QCFeXiFAI0BAJCQkJCQ=', '')
		   .replace('Xl4jQEAhIUAjISQ=', '')
		   .replace('Xl5eXl5eIyNAzN2FkZmRm', '')
		   .split('//_//')
		   .join('')
		   .substr(2)
		    try {
		      return atob(file)
		    } catch (e){
		      console.log("Encrypt error: ", file)
		   return ''
		    }
		}
		*/
		/**
		 * РџРѕР»СѓС‡РёС‚СЊ РґР°РЅРЅС‹Рµ Рѕ С„РёР»СЊРјРµ
		 * @param {String} str 
		 */
		function extractData(str) {
			extract.voice = [];
			extract.season = [];
			extract.episode = [];
			str = str.replace(/\n/g, '');
			var voices = str.match('<select name="translator"[^>]+>(.*?)</select>');
			var sesons = str.match('<select name="season"[^>]+>(.*?)</select>');
			var episod = str.match('<select name="episode"[^>]+>(.*?)</select>');
			if (sesons) {
				var select = $('<select>' + sesons[1] + '</select>');
				$('option', select).each(function () {
					extract.season.push({
						id: $(this).attr('value'),
						name: $(this).text()
					});
				});
			}
			if (voices) {
				var _select = $('<select>' + voices[1] + '</select>');
				$('option', _select).each(function () {
					var token = $(this).attr('data-token');
					var transl = $(this).text() !== '-' ? $(this).text() : 'РћСЂРёРіРёРЅР°Р»';
					if (token) {
						extract.voice.push({
							token: token,
							name: transl,
							id: $(this).val()
						});
					}
				});
			}
			if (episod) {
				var _select2 = $('<select>' + episod[1] + '</select>');
				$('option', _select2).each(function () {
					extract.episode.push({
						id: $(this).attr('value'),
						name: $(this).text()
					});
				});
			}
		}
		/**
		 * РџРѕРєР°Р·Р°С‚СЊ С„Р°Р№Р»С‹
		 */
		function append() {
			component.reset();
			var items = [];
			var viewed = Lampa.Storage.cache('online_view', 5000, []);
			if (extract.season.length) {
				var voice = getChoiceVoice();
				extract.episode.forEach(function (episode) {
					var season = extract.season[Math.min(extract.season.length - 1, choice.season)].id;
					items.push({
						title: object.movie.title + ' - S' + season + ' / ' + episode.name,
						quality: extract.voice[choice.voice].name,
						season: season,
						episode: parseInt(episode.id),
						info: '',
						voice: voice
					});
				});
			} else {
				extract.voice.forEach(function (voice) {
					items.push({
						title: voice.name,
						quality: '720p ~ 1080p',
						voice: voice,
						info: ''
					});
				});
			}
			items.forEach(function (element) {
				var hash = Lampa.Utils.hash(element.season ? [element.season, element.episode, object.movie.original_title].join('') : object.movie.original_title);
				var view = Lampa.Timeline.view(hash);
				var item = Lampa.Template.get('onlines_v1', element);
				var hash_file = Lampa.Utils.hash(element.season ? [element.season, element.episode, object.movie.original_title, element.voice.name].join('') : object.movie.original_title + element.voice.name);
				item.addClass('video--stream');
				element.timeline = view;
				item.append(Lampa.Timeline.render(view));
				if (Lampa.Timeline.details) {
					item.find('.online__quality').append(Lampa.Timeline.details(view, ' / '));
				}
				if (viewed.indexOf(hash_file) !== -1) item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');

				function contextmenu() {
					component.contextmenu({
						item: item,
						view: view,
						viewed: viewed,
						hash_file: hash_file,
						file: function file(call) {
							getStream(element, function (stream) {
								call({
									file: stream,
									quality: element.qualitys
								});
							});
						}
					});
				}
				var dbtimer,
					dbtime = Date.now();
				item.on('hover:enter', function () {
					if (dbtime < Date.now() - 200) {
						dbtimer = setTimeout(function () {
							if (object.movie.id) Lampa.Favorite.add('history', object.movie, 100);
							getStream(element, function (stream) {
								var first = {
									url: stream,
									timeline: view,
									quality: element.qualitys,
									title: element.season ? element.title : object.movie.title + ' / ' + element.title
								};
								Lampa.Player.play(first);
								Lampa.Player.playlist([first]);
								if (element.subtitles && Lampa.Player.subtitles) Lampa.Player.subtitles(element.subtitles);
								if (viewed.indexOf(hash_file) == -1) {
									viewed.push(hash_file);
									item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
									Lampa.Storage.set('online_view', viewed);
									component.new_seria();
								}
							}, function () {
								Lampa.Noty.show('РќРµ СѓРґР°Р»РѕСЃСЊ РёР·РІР»РµС‡СЊ СЃСЃС‹Р»РєСѓ');
							});
						}, 200);
						dbtime = Date.now() + 200;
					} else if (dbtime > Date.now()) {
						clearTimeout(dbtimer);
						contextmenu();
					}
				}).on('hover:long', function () {
					contextmenu();
				}).on('hover:focus', function () {
					if (Lampa.Helper) Lampa.Helper.show('online_file', 'РЈРґРµСЂР¶РёРІР°Р№С‚Рµ РєР»Р°РІРёС€Сѓ (РћРљ) РґР»СЏ РІС‹Р·РѕРІР° РєРѕРЅС‚РµРєСЃС‚РЅРѕРіРѕ РјРµРЅСЋ', item);
				});
				component.append(item);
			});
			component.start(true);
		}
	}

	function Kinobase(component, _object) {
		var network = new Lampa.Reguest();
		var extract = [];
		var prox = Lampa.Storage.field('proxy_other') === false ? '' : 'https://cors.eu.org/';
		var embed = prox + 'https://kinobase.org/';
		var object = _object;
		var select_title = '';
		var select_id = '';
		var filter_items = {};
		var voic = '';
		var choice = {
			season: 0,
			voice: 0
		};
		/**
		 * РџРѕРёСЃРє
		 * @param {Object} _object
		 * @param {String} kp_id 
		 */
		this.search = function (_object, kp_id, sim) {
			var _this = this;
			if (this.wait_similars && sim) return getPage(sim[0].link);
			object = _object;
			select_title = object.search;
			var url = embed + "search?query=" + encodeURIComponent(cleanTitle(select_title));
			network["native"](url, function (str) {
				str = str.replace(/\n/, '');
				var links = object.movie.number_of_seasons ? str.match(/<a href="\/serial\/(.*?)">(.*?)<\/a>/g) : str.match(/<a href="\/film\/(.*?)" class="link"[^>]+>(.*?)<\/a>/g);
				var relise = object.search_date || (object.movie.number_of_seasons ? object.movie.first_air_date : object.movie.release_date) || '0000';
				var need_year = parseInt((relise + '').slice(0, 4));
				var found_url = '';
				if (links) {
					var cards = [];
					links.filter(function (l) {
						var link = $(l),
							titl = link.attr('title') || link.text() || '';
						var year = parseInt(titl.split('(').pop().slice(0, -1));
						if (year > need_year - 2 && year < need_year + 2) cards.push({
							year: year,
							title: titl.split(/\(\d{4}\)/)[0].trim(),
							link: link.attr('href')
						});
					});
					var card = cards.find(function (c) {
						return c.year == need_year;
					});
					if (!card) card = cards.find(function (c) {
						return c.title == select_title;
					});
					if (!card && cards.length == 1) card = cards[0];
					if (card) found_url = cards[0].link;
					if (found_url) getPage(found_url);
					else if (!found_url && links.length) {
						_this.wait_similars = true;
						var similars = [];
						links.forEach(function (l) {
							var link = $(l),
								titl = link.attr('title') || link.text();
							similars.push({
								title: titl,
								link: link.attr('href'),
								filmId: 'similars'
							});
						});
						component.similars(similars);
						component.loading(false);
					} else component.empty('РџРѕ Р·Р°РїСЂРѕСЃСѓ (' + select_title + ') РЅРµС‚ СЂРµР·СѓР»СЊС‚Р°С‚РѕРІ');
				} else component.empty('РџРѕ Р·Р°РїСЂРѕСЃСѓ (' + select_title + ') РЅРµС‚ СЂРµР·СѓР»СЊС‚Р°С‚РѕРІ');
			}, function (a, c) {
				component.empty(network.errorDecode(a, c));
			}, false, {
				dataType: 'text'
			});
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
				voice: 0
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
			extract = null;
		};

		function cleanTitle(str) {
			return str.replace('СЂ.', 'СЂ:').split(':').shift();
		}

		function filter() {
			filter_items = {
				season: [],
				voice: [],
				quality: []
			};
			if (object.movie.number_of_seasons) {
				if (extract[0] && extract[0].playlist) {
					extract.forEach(function (item) {
						filter_items.season.push(item.comment);
					});
				}
			} else {
				var voices = [];
				extract.forEach(function (movie) {
					var transl = movie.voice || movie.comment;
					voices.push(transl);
				});
				var g = voices.filter(function (item, position, array) {
					return array.lastIndexOf(item) === position; // РІРµСЂРЅС‘Рј СѓРЅРёРєР°Р»СЊРЅС‹Рµ СЌР»РµРјРµРЅС‚С‹
				});
				g.forEach(function (voic) {
					filter_items.voice.push(voic);
				});
			}
			component.filter(filter_items, choice);
		}

		function filtred() {
			var filtred = [];
			var filter_data = Lampa.Storage.get('online_filter', '{}');
			if (extract[choice.season] && object.movie.number_of_seasons) {
				var playlist = extract[choice.season].playlist || extract;
				var season = parseInt(extract[choice.season].comment);
				playlist.forEach(function (serial) {
					var quality = serial.file.match(/\[(\d+)p\]/g).pop().replace(/\[|\]/g, '');
					var voice = serial.file.match("{([^}]+)}");
					var voice2 = serial.comment.split('СЏ ')[1];
					var voices = voice ? voice[1] : voice2 ? voice2 : voic;
					filtred.push({
						file: serial.file,
						title: voice2 ? serial.comment.split(' ')[0] + ' СЃРµСЂРёСЏ' : serial.comment,
						quality: quality,
						season: isNaN(season) ? 1 : season,
						episode: voice2 ? serial.comment.split(' ')[0] : parseInt(serial.comment),
						voice: voices,
						info: voice ? ' / ' + voice[1] : voice2 ? ' / ' + voice2 : ' / ' + voic,
						subtitles: parseSubs(serial.subtitle || '')
					});
				});
			} else {
				var fil = [];
				extract.forEach(function (element) {
					if ((element.voice || element.comment) == filter_items.voice[filter_data.voice]) {
						var quality = element.file.match(/\[(\d+)p\]/g).pop().replace(/\[|\]/g, '');
						filtred.push({
							file: element.file,
							title: element.voice || element.comment,
							quality: element.quality || quality,
							info: '',
							subtitles: element.subtitles
						});
					}
				});
			}
			return filtred;
		}

		function parseSubs(vod) {
			var subtitles = [];
			vod.split(',').forEach(function (s) {
				var nam = s.match("\\[(.*?)]");
				if (nam) {
					var url = s.replace(/\[.*?\]/, '').split(' or ')[0];
					if (url) {
						subtitles.push({
							label: nam[1],
							url: url
						});
					}
				}
			});
			return subtitles.length ? subtitles : false;
		}
		/**
		 * РџРѕР»СѓС‡РёС‚СЊ РґР°РЅРЅС‹Рµ Рѕ С„РёР»СЊРјРµ
		 * @param {String} str
		 */
		function extractData(str, page) {
			var vod = str.split('|');
			if (vod[0] == 'file') {
				var file = str.match("file\\|([^\\|]+)\\|");
				var found = [];
				var subtiles = parseSubs(vod[2]);
				var quality_type = page.replace(/\n/g, '').replace(/ /g, '').match(/<li><b>РљР°С‡РµСЃС‚РІРѕ:<\/b>(\w+)<\/li>/i);
				if (file) {
					str = file[1].replace(/\n/g, '');
					str.split(',').forEach(function (el) {
						var quality = el.match("\\[(\\d+)p");
						el.split(';').forEach(function (el2) {
							var voice = el2.match("{([^}]+)}");
							var links = voice ? el2.match("}([^;]+)") : el2.match("\\]([^;]+)");
							found.push({
								file: file[1],
								title: object.movie.title,
								quality: quality[1] + 'p' + (quality_type ? ' - ' + quality_type[1] : ''),
								voice: voice ? voice[1] : voic,
								stream: links[1].split(' or ')[0],
								subtitles: subtiles,
								info: ' '
							});
						});
					});
					found.reverse();
				}
				extract = found;
			} else if (vod[0] == 'pl') extract = Lampa.Arrays.decodeJson(vod[1], []);
			else component.empty();
		}

		function getPage(url) {
			network.clear();
			network.timeout(1000 * 10);
			network["native"](embed + url, function (str) {
				str = str.replace(/\n/g, '');
				var voices = str.match('<ul class="list-unstyled details">(.*?)</ul>');
				$(voices, 'li').each(function (r, a) {
					var vsrt = a.match('<li><b>РџРµСЂРµРІРѕРґ:</b>(.*?)</li>');
					voic = vsrt[1];
				});
				var MOVIE_ID = str.match('var MOVIE_ID = ([^;]+);');
				var PLAYER_CUID = str.match('var PLAYER_CUID = "([^"]+)"');
				var IDENTIFIER = str.match('var IDENTIFIER = "([^"]+)"');
				if (MOVIE_ID && IDENTIFIER && PLAYER_CUID) {
					select_id = MOVIE_ID[1];
					var identifier = IDENTIFIER[1];
					var player_cuid = PLAYER_CUID[1];
					var data_url = "user_data";
					data_url = Lampa.Utils.addUrlComponent(data_url, "page=movie");
					data_url = Lampa.Utils.addUrlComponent(data_url, "movie_id=" + select_id);
					data_url = Lampa.Utils.addUrlComponent(data_url, "cuid=" + player_cuid);
					data_url = Lampa.Utils.addUrlComponent(data_url, "device=DESKTOP"); //MOBILE/TV
					data_url = Lampa.Utils.addUrlComponent(data_url, "_=" + Date.now());
					network.clear();
					network.timeout(1000 * 10);
					network["native"](embed + data_url, function (json) {
						if (json.vod_hash && json.vod_time) {
							var file_url = "vod/" + select_id;
							file_url = Lampa.Utils.addUrlComponent(file_url, "identifier=" + identifier);
							file_url = Lampa.Utils.addUrlComponent(file_url, "player_type=new");
							file_url = Lampa.Utils.addUrlComponent(file_url, "file_type=mp4"); //hls
							file_url = Lampa.Utils.addUrlComponent(file_url, "st=" + json.vod_hash);
							file_url = Lampa.Utils.addUrlComponent(file_url, "e=" + json.vod_time);
							file_url = Lampa.Utils.addUrlComponent(file_url, "_=" + Date.now());
							network.clear();
							network.timeout(1000 * 10);
							network["native"](embed + file_url, function (files) {
								component.loading(false);
								extractData(files, str);
								filter();
								append(filtred());
							}, function (a, c) {
								component.empty(network.errorDecode(a, c));
							}, false, {
								dataType: 'text'
							});
						} else component.empty('РќРµ СѓРґР°Р»РѕСЃСЊ РїРѕР»СѓС‡РёС‚СЊ HASH');
					}, function (a, c) {
						component.empty(network.errorDecode(a, c));
					});
				} else component.empty('РќРµ СѓРґР°Р»РѕСЃСЊ РїРѕР»СѓС‡РёС‚СЊ РґР°РЅРЅС‹Рµ');
			}, function (a, c) {
				component.empty(network.errorDecode(a, c));
			}, false, {
				dataType: 'text'
			});
		}

		function getFile(element) {
			var quality = {},
				first = '';
			var preferably = Lampa.Storage.get('video_quality_default', '1080');
			element.file.split(',').reverse().forEach(function (file) {
				var q = file.match("\\[(\\d+)p");
				if (q) {
					quality[q[1] + 'p'] = file.replace(/\[\d+p\]/, '').replace(/{([^}]+)}/, '').split(' or ')[0];
					if (!first || q[1] == preferably) first = quality[q[1] + 'p'];
				}
			});
			element.stream = first;
			element.qualitys = quality;
			return {
				file: first,
				quality: quality
			};
		}
		/**
		 * РџРѕРєР°Р·Р°С‚СЊ С„Р°Р№Р»С‹
		 */
		function append(items) {
			component.reset();
			var viewed = Lampa.Storage.cache('online_view', 5000, []);
			items.forEach(function (element) {
				if (element.season) element.title = object.movie.title + ' - S' + element.season + ' / ' + element.title;
				if (!element.season && element.voice) element.title = element.voice;
				var hash = Lampa.Utils.hash(element.season ? [element.season, element.episode, object.movie.original_title].join('') : object.movie.original_title);
				var view = Lampa.Timeline.view(hash);
				var item = Lampa.Template.get('onlines_v1', element);
				var hash_file = Lampa.Utils.hash(element.season ? [element.season, element.episode, object.movie.original_title, element.title].join('') : object.movie.original_title + element.title + element.quality);
				item.addClass('video--stream');
				element.timeline = view;
				item.append(Lampa.Timeline.render(view));
				if (Lampa.Timeline.details) {
					item.find('.online__quality').append(Lampa.Timeline.details(view, ' / '));
				}
				if (viewed.indexOf(hash_file) !== -1) item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');

				function contextmenu() {
					component.contextmenu({
						item: item,
						view: view,
						viewed: viewed,
						hash_file: hash_file,
						file: function file(call) {
							call(getFile(element));
						}
					});
				}
				var dbtimer,
					dbtime = Date.now();
				item.on('hover:enter', function () {
					if (dbtime < Date.now() - 200) {
						dbtimer = setTimeout(function () {
							if (object.movie.id) Lampa.Favorite.add('history', object.movie, 100);
							getFile(element);
							if (element.stream || element.file) {
								var playlist = [];
								var first = {
									url: element.stream ? element.stream : element.file,
									timeline: view,
									title: element.season ? element.title : object.movie.title + ' / ' + element.title,
									subtitles: element.subtitles,
									quality: element.qualitys
								};
								if (element.season) {
									items.forEach(function (elem) {
										getFile(elem);
										playlist.push({
											title: elem.title,
											url: elem.stream,
											timeline: elem.timeline,
											subtitles: elem.subtitles,
											quality: elem.qualitys
										});
									});
								} else {
									playlist.push(first);
								}
								if (playlist.length > 1) first.playlist = playlist;
								Lampa.Player.play(first);
								Lampa.Player.playlist(playlist);
								if (viewed.indexOf(hash_file) == -1) {
									viewed.push(hash_file);
									item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
									Lampa.Storage.set('online_view', viewed);
									component.new_seria();
								}
							} else Lampa.Noty.show('РќРµ СѓРґР°Р»РѕСЃСЊ РёР·РІР»РµС‡СЊ СЃСЃС‹Р»РєСѓ');
						}, 200);
						dbtime = Date.now() + 200;
					} else if (dbtime > Date.now()) {
						clearTimeout(dbtimer);
						contextmenu();
					}
				}).on('hover:long', function () {
					contextmenu();
				}).on('hover:focus', function () {
					if (Lampa.Helper) Lampa.Helper.show('online_file', 'РЈРґРµСЂР¶РёРІР°Р№С‚Рµ РєР»Р°РІРёС€Сѓ (РћРљ) РґР»СЏ РІС‹Р·РѕРІР° РєРѕРЅС‚РµРєСЃС‚РЅРѕРіРѕ РјРµРЅСЋ', item);
				});
				component.append(item);
			});
			component.start(true);
		}
	}

	function Collaps(component, _object) {
		var network = new Lampa.Reguest();
		var extract = {};
		var embed = 'https://api.topdbltj.ws/embed/';
		var object = _object;
		var select_title = '';
		var filter_items = {};
		var choice = {
			season: 0,
			voice: 0
		};
		/**
		 * РџРѕРёСЃРє
		 * @param {Object} _object 
		 */
		this.search = function (_object, kinopoisk_id) {
			object = _object;
			select_title = object.search;
			var url = embed + 'kp/' + kinopoisk_id;
			network.silent(url, function (str) {
				if (str) {
					parse(str);
				} else component.empty('РџРѕ Р·Р°РїСЂРѕСЃСѓ (' + select_title + ') РЅРµС‚ СЂРµР·СѓР»СЊС‚Р°С‚РѕРІ');
				component.loading(false);
			}, function (a, c) {
				component.empty(network.errorDecode(a, c));
			}, false, {
				dataType: 'text'
			});
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
				voice: 0
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
			extract = null;
		};

		function parse(str) {
			str = str.replace(/\n/g, '');
			var find = str.match('makePlayer\\({(.*?)}\\);');
			var json;
			try {
				json = find && eval('({' + find[1] + '})');
			} catch (e) {}
			if (json) {
				extract = json;
				filter();
				append(filtred());
			} else component.empty("РќРµ РЅР°С€Р»Рё " + select_title);
		}
		/**
		 * РџРѕСЃС‚СЂРѕРёС‚СЊ С„РёР»СЊС‚СЂ
		 */
		function filter() {
			filter_items = {
				season: [],
				voice: [],
				quality: []
			};
			if (extract.playlist) {
				if (extract.playlist.seasons) {
					extract.playlist.seasons.forEach(function (season) {
						filter_items.season.push('РЎРµР·РѕРЅ ' + season.season);
					});
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
			if (extract.playlist) {
				extract.playlist.seasons.forEach(function (season, i) {
					if (i == filter_data.season) {
						season.episodes.forEach(function (episode) {
							var resolution = Lampa.Arrays.getKeys(extract.qualityByWidth).pop();
							var max_quality = resolution ? extract.qualityByWidth[resolution] || 0 : '';
							filtred.push({
								file: episode.hls,
								episode: parseInt(episode.episode),
								season: parseInt(season.season),
								title: episode.title,
								quality: max_quality ? max_quality + 'p / ' : '',
								info: episode.audio.names.slice(0, 5).join(', '),
								subtitles: episode.cc ? episode.cc.map(function (c) {
									return {
										label: c.name,
										url: c.url
									};
								}) : false
							});
						});
					}
				});
			} else if (extract.source) {
				var resolution = Lampa.Arrays.getKeys(extract.qualityByWidth).pop();
				var max_quality = extract.qualityByWidth ? extract.qualityByWidth[resolution] || 0 : 0;
				filtred.push({
					file: extract.source.hls,
					title: extract.title,
					quality: max_quality ? max_quality + 'p / ' : '',
					info: extract.source.audio.names.slice(0, 5).join(', '),
					subtitles: extract.source.cc ? extract.source.cc.map(function (c) {
						return {
							label: c.name,
							url: c.url
						};
					}) : false
				});
			}
			return filtred;
		}
		/**
		 * РџРѕРєР°Р·Р°С‚СЊ С„Р°Р№Р»С‹
		 */
		function append(items) {
			component.reset();
			var viewed = Lampa.Storage.cache('online_view', 5000, []);
			items.forEach(function (element) {
				if (element.season) element.title = object.movie.title + ' - S' + element.season + ' / РЎРµСЂРёСЏ ' + element.episode;
				var hash = Lampa.Utils.hash(element.season ? [element.season, element.episode, object.movie.original_title].join('') : object.movie.original_title);
				var view = Lampa.Timeline.view(hash);
				var item = Lampa.Template.get('onlines_v1', element);
				var hash_file = Lampa.Utils.hash(element.season ? [element.season, element.episode, object.movie.original_title, element.title].join('') : object.movie.original_title + element.title);
				item.addClass('video--stream');
				element.timeline = view;
				item.append(Lampa.Timeline.render(view));
				if (Lampa.Timeline.details) {
					item.find('.online__quality').append(Lampa.Timeline.details(view, ' / '));
				}
				if (viewed.indexOf(hash_file) !== -1) item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');

				function contextmenu() {
					component.contextmenu({
						item: item,
						view: view,
						viewed: viewed,
						hash_file: hash_file,
						file: function file(call) {
							call({
								file: element.file
							});
						}
					});
				}
				var dbtimer,
					dbtime = Date.now();
				item.on('hover:enter', function () {
					if (dbtime < Date.now() - 200) {
						dbtimer = setTimeout(function () {
							if (object.movie.id) Lampa.Favorite.add('history', object.movie, 100);
							if (element.file) {
								var playlist = [];
								var first = {
									url: element.file,
									timeline: view,
									title: element.season ? element.title : object.movie.title + ' / ' + element.info,
									subtitles: element.subtitles
								};
								if (element.season) {
									items.forEach(function (elem) {
										playlist.push({
											title: elem.title,
											url: elem.file,
											timeline: elem.timeline,
											subtitles: elem.subtitles
										});
									});
								} else {
									playlist.push(first);
								}
								if (playlist.length > 1) first.playlist = playlist;
								Lampa.Player.play(first);
								Lampa.Player.playlist(playlist);
								if (viewed.indexOf(hash_file) == -1) {
									viewed.push(hash_file);
									item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
									Lampa.Storage.set('online_view', viewed);
									component.new_seria();
								}
							} else Lampa.Noty.show('РќРµ СѓРґР°Р»РѕСЃСЊ РёР·РІР»РµС‡СЊ СЃСЃС‹Р»РєСѓ');
						}, 200);
						dbtime = Date.now() + 200;
					} else if (dbtime > Date.now()) {
						clearTimeout(dbtimer);
						contextmenu();
					}
				}).on('hover:long', function () {
					contextmenu();
				}).on('hover:focus', function () {
					if (Lampa.Helper) Lampa.Helper.show('online_file', 'РЈРґРµСЂР¶РёРІР°Р№С‚Рµ РєР»Р°РІРёС€Сѓ (РћРљ) РґР»СЏ РІС‹Р·РѕРІР° РєРѕРЅС‚РµРєСЃС‚РЅРѕРіРѕ РјРµРЅСЋ', item);
				});
				component.append(item);
			});
			component.start(true);
		}
	}

	function Filmix(component, _object) {
		var network = new Lampa.Reguest();
		var extract = {};
		var results = [];
		var object = _object;
		var embed = 'http://filmixapp.cyou/api/v2/';
		var select_title = '';
		var filter_items = {};
		var choice = {
			season: 0,
			voice: 0
		};
		var token = Lampa.Storage.get('filmix_token', '');
		if (!window.filmix) {
			window.filmix = {
				max_qualitie: 720,
				is_max_qualitie: false
			};
		}
		var dev_token = '?user_dev_apk=1.1.3&&user_dev_name=Xiaomi&user_dev_os=11&user_dev_token=' + token + '&user_dev_vendor=Xiaomi';
		/**
		 * РќР°С‡Р°С‚СЊ РїРѕРёСЃРє
		 * @param {Object} _object 
		 */
		this.search = function (_object, data) {
			var _this = this;
			if (this.wait_similars && data[0]) return this.find(data[0].id);
			object = _object;
			select_title = object.search;
			var item = data[0];
			var year = parseInt((object.movie.release_date || object.movie.first_air_date || '0000').slice(0, 4));
			var orig = object.movie.original_title || object.movie.original_name;
			var url = embed + 'suggest';
			url = Lampa.Utils.addUrlComponent(url, 'word=' + encodeURIComponent(select_title));
			network.clear();
			network.timeout(10000);
			network.silent(url, function (json) {
				var cards = json.filter(function (c) {
					c.year = parseInt(c.alt_name.split('-').pop());
					return c.year > year - 2 && c.year < year + 2;
				});
				var card = cards.find(function (c) {
					return c.year == year;
				});
				if (!card) {
					card = cards.find(function (c) {
						return c.original_title == orig;
					});
				}
				if (!card && cards.length == 1) card = cards[0];
				else if (!card) {
					card = json.find(function (c) {
						return (c.original_title || c.title) == orig;
					});
					if (!card) {
						card = json.find(function (c) {
							return c.title == select_title;
						});
					}
				}
				if (card) _this.find(card.id);
				else {
					_this.wait_similars = true;
					component.similars(json);
					component.loading(false);
				}
			}, function (a, c) {
				component.empty(network.errorDecode(a, c));
			});
		};
		this.find = function (filmix_id) {
			var url = embed;
			if (!window.filmix.is_max_qualitie && token) {
				window.filmix.is_max_qualitie = true;
				network.clear();
				network.timeout(10000);
				network.silent(url + 'user_profile' + dev_token, function (found) {
					if (found && found.user_data) {
						if (found.user_data.is_pro) window.filmix.max_qualitie = 1080;
						if (found.user_data.is_pro_plus) window.filmix.max_qualitie = 2160;
					}
					end_search(filmix_id);
				});
			} else end_search(filmix_id);

			function end_search(filmix_id) {
				network.clear();
				network.timeout(10000);
				network.silent(window.filmix.is_max_qualitie ? url + 'post/' + filmix_id + dev_token : url + 'post/' + filmix_id, function (found) {
					if (found && Object.keys(found).length) {
						success(found);
						component.loading(false);
					} else component.empty('РџРѕ Р·Р°РїСЂРѕСЃСѓ (' + select_title + ') РЅРµС‚ СЂРµР·СѓР»СЊС‚Р°С‚РѕРІ');
				}, function (a, c) {
					component.empty(network.errorDecode(a, c));
				});
			}
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
				voice: 0
			};
			filter();
			extractData(results);
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
			extractData(results);
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
		 * РџРѕР»СѓС‡РёС‚СЊ РёРЅС„РѕСЂРјР°С†РёСЋ Рѕ С„РёР»СЊРјРµ
		 * @param {Arrays} data
		 */
		function extractData(data) {
			extract = {};
			var pl_links = data.player_links;
			if (pl_links.playlist && Object.keys(pl_links.playlist).length > 0) {
				var seas_num = 0;
				for (var season in pl_links.playlist) {
					var episode = pl_links.playlist[season];
					++seas_num;
					var transl_id = 0;
					for (var voice in episode) {
						var episode_voice = episode[voice];
						++transl_id;
						var items = [];
						for (var ID in episode_voice) {
							var file_episod = episode_voice[ID];
							var quality_eps = file_episod.qualities.filter(function (qualitys) {
								return qualitys <= window.filmix.max_qualitie;
							});
							var max_quality = Math.max.apply(null, quality_eps);
							var stream_url = file_episod.link.replace('%s.mp4', max_quality + '.mp4');
							var s_e = stream_url.slice(0 - stream_url.length + stream_url.lastIndexOf('/'));
							var str_s_e = s_e.match(/s(\d+)e(\d+?)_\d+\.mp4/i);
							var str_e = s_e.match(/e(\d+?)_\d+\.mp4/i);
							if (str_s_e || str_e) {
								var _seas_num = parseInt(str_s_e[1]);
								var _epis_num = parseInt(str_s_e[2]) || parseInt(str_e[1]);
								items.push({
									id: _seas_num + '_' + _epis_num,
									comment: _epis_num + ' РЎРµСЂРёСЏ <i>' + ID + '</i>',
									file: stream_url,
									episode: _epis_num,
									season: _seas_num,
									quality: max_quality,
									qualities: quality_eps,
									translation: transl_id
								});
							}
						}
						if (!extract[transl_id]) extract[transl_id] = {
							json: [],
							file: ''
						};
						extract[transl_id].json.push({
							id: seas_num,
							comment: seas_num + ' СЃРµР·РѕРЅ',
							folder: items,
							translation: transl_id
						});
					}
				}
			} else if (pl_links.movie && pl_links.movie.length > 0) {
				var _transl_id = 0;
				for (var _ID in pl_links.movie) {
					var _file_episod = pl_links.movie[_ID];
					++_transl_id;
					var _quality_eps = _file_episod.link.match(/.+\[(.+[\d]),?\].+/i);
					if (_quality_eps) _quality_eps = _quality_eps[1].split(',').filter(function (quality_) {
						return quality_ <= window.filmix.max_qualitie;
					});
					var _max_quality = Math.max.apply(null, _quality_eps);
					var file_url = _file_episod.link.replace(/\[(.+[\d]),?\]/i, _max_quality);
					extract[_transl_id] = {
						file: file_url,
						translation: _file_episod.translation,
						quality: _max_quality,
						qualities: _quality_eps
					};
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
			if (translat) {
				if (element.season || element.episode)
					for (var i in translat.json) {
						var elem = translat.json[i];
						if (elem.folder)
							for (var f in elem.folder) {
								var folder = elem.folder[f];
								if (folder.id == id) {
									file = folder.file;
									break;
								}
							} else {
								if (elem.id == id) {
									file = elem.file;
									break;
								}
							}
					} else file = translat.file;
			}
			max_quality = parseInt(max_quality);
			if (file) {
				var link = file.slice(0, file.lastIndexOf('_')) + '_';
				var orin = file.split('?');
				orin = orin.length > 1 ? '?' + orin.slice(1).join('?') : '';
				if (file.split('_').pop().replace('.mp4', '') !== max_quality) {
					file = link + max_quality + '.mp4' + orin;
				}
				quality = {};
				var mass = [2160, 1440, 1080, 720, 480, 360];
				mass = mass.slice(mass.indexOf(max_quality));
				mass.forEach(function (n) {
					quality[n + 'p'] = link + n + '.mp4' + orin;
				});
				var preferably = Lampa.Storage.get('video_quality_default', '1080') + 'p';
				if (quality[preferably]) file = quality[preferably];
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
				voice_info: []
			};
			if (results.last_episode && results.last_episode.season) {
				var s = results.last_episode.season;
				while (s--) {
					filter_items.season.push('РЎРµР·РѕРЅ ' + (results.last_episode.season - s));
				}
			}
			for (var Id in results.player_links.playlist) {
				var season = results.player_links.playlist[Id];
				var d = 0;
				for (var voic in season) {
					++d;
					if (filter_items.voice.indexOf(voic) == -1) {
						filter_items.voice.push(voic);
						filter_items.voice_info.push({
							id: d
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
			if (Object.keys(results.player_links.playlist).length) {
				for (var transl in extract) {
					var element = extract[transl];
					for (var season_id in element.json) {
						var episode = element.json[season_id];
						if (episode.id == filter_data.season + 1) {
							episode.folder.forEach(function (media) {
								if (media.translation == filter_items.voice_info[filter_data.voice].id) {
									filtred.push({
										episode: parseInt(media.episode),
										season: media.season,
										title: media.episode + (media.title ? ' - ' + media.title : ''),
										quality: media.quality + 'p ',
										translation: media.translation
									});
								}
							});
						}
					}
				}
			} else if (Object.keys(results.player_links.movie).length) {
				for (var transl_id in extract) {
					var _element = extract[transl_id];
					filtred.push({
						title: _element.translation,
						quality: _element.quality + 'p ',
						qualitys: _element.qualities,
						translation: transl_id
					});
				}
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
				if (element.season) element.title = object.movie.title + ' - S' + element.season + ' / РЎРµСЂРёСЏ ' + element.title;
				if (!element.season && element.episode) element.title = object.movie.title + ' - РЎРµСЂРёСЏ ' + element.title;
				element.info = element.season ? ' / ' + filter_items.voice[choice.voice] : '';
				var hash = Lampa.Utils.hash(element.season ? [element.season, element.episode, object.movie.original_title].join('') : object.movie.original_title);
				var view = Lampa.Timeline.view(hash);
				var item = Lampa.Template.get('onlines_v1', element);
				var hash_file = Lampa.Utils.hash(element.season ? [element.season, element.episode, object.movie.original_title, filter_items.voice[choice.voice]].join('') : object.movie.original_title + element.title);
				item.addClass('video--stream');
				element.timeline = view;
				item.append(Lampa.Timeline.render(view));
				if (Lampa.Timeline.details) {
					item.find('.online__quality').append(Lampa.Timeline.details(view, ' / '));
				}
				if (viewed.indexOf(hash_file) !== -1) item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');

				function contextmenu() {
					var files = getFile(element, element.quality);
					component.contextmenu({
						item: item,
						view: view,
						viewed: viewed,
						hash_file: hash_file,
						file: function file(call) {
							call(getFile(element, element.quality));
						}
					});
				}
				var dbtimer,
					dbtime = Date.now();
				item.on('hover:enter', function () {
					if (dbtime < Date.now() - 200) {
						dbtimer = setTimeout(function () {
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
								if (viewed.indexOf(hash_file) == -1) {
									viewed.push(hash_file);
									item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
									Lampa.Storage.set('online_view', viewed);
									component.new_seria();
								}
							} else Lampa.Noty.show('РќРµ СѓРґР°Р»РѕСЃСЊ РёР·РІР»РµС‡СЊ СЃСЃС‹Р»РєСѓ');
						}, 200);
						dbtime = Date.now() + 200;
					} else if (dbtime > Date.now()) {
						clearTimeout(dbtimer);
						contextmenu();
					}
				}).on('hover:long', function () {
					contextmenu();
				}).on('hover:focus', function () {
					if (Lampa.Helper) Lampa.Helper.show('online_file', 'РЈРґРµСЂР¶РёРІР°Р№С‚Рµ РєР»Р°РІРёС€Сѓ (РћРљ) РґР»СЏ РІС‹Р·РѕРІР° РєРѕРЅС‚РµРєСЃС‚РЅРѕРіРѕ РјРµРЅСЋ', item);
				});
				component.append(item);
			});
			component.start(true);
		}
	}

	function CDNMovies(component, _object) {
		var network = new Lampa.Reguest();
		var extract = [];
		var object = _object;
		var select_title = '';
		var prox = Lampa.Storage.field('proxy_other') === false ? '' : 'https://cors.eu.org/';
		var embed = prox + 'https://cdnmovies.net/api/short';
		var token = '02d56099082ad5ad586d7fe4e2493dd9';
		var filter_items = {};
		var choice = {
			season: 0,
			voice: 0
		};
		/**
		 * РќР°С‡Р°С‚СЊ РїРѕРёСЃРє
		 * @param {Object} _object 
		 */
		this.search = function (_object, kp_id) {
			var _this = this;
			object = _object;
			select_title = object.search;
			var url = embed;
			url = Lampa.Utils.addUrlComponent(url, 'token=' + token);
			url = Lampa.Utils.addUrlComponent(url, 'kinopoisk_id=' + kp_id);
			network.silent(url, function (str) {
				var iframe = String(str).match('"iframe_src":"(.*?)"');
				if (iframe && iframe[1]) {
					iframe = 'https:' + iframe[1].split('\\').join('');
					_this.find(iframe);
				} else component.empty('РџРѕ Р·Р°РїСЂРѕСЃСѓ (' + select_title + ') РЅРµС‚ СЂРµР·СѓР»СЊС‚Р°С‚РѕРІ');
			}, function (a, c) {
				component.empty(network.errorDecode(a, c));
			}, false, {
				dataType: 'text'
			});
		};
		this.find = function (url) {
			network.clear();
			network.timeout(10000);
			network.silent(url, function (json) {
				parse(json);
				component.loading(false);
			}, function (a, c) {
				component.empty(network.errorDecode(a, c));
			}, false, {
				dataType: 'text'
			});
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
				voice: 0
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
		};

		function parse(str) {
			str = str.replace(/\n/g, '');
			var find = str.match("Playerjs\\({.*?file:'(.*?)'.*?}\\);");
			var video = find && decode(find[1]);
			var json;
			try {
				json = video && JSON.parse(video);
			} catch (e) {}
			if (json) {
				extract = json;
				filter();
				append(filtred());
			} else component.empty('РџРѕ Р·Р°РїСЂРѕСЃСѓ (' + select_title + ') РЅРµС‚ СЂРµР·СѓР»СЊС‚Р°С‚РѕРІ');
		}

		function decode(data) {
			data = data.replace('#2', '').replace('//NTR2amZoY2dkYnJ5ZGtjZmtuZHo1Njg0MzZmcmVkKypk', '').replace('//YXorLWVydyozNDU3ZWRndGpkLWZlcXNwdGYvcmUqcSpZ', '').replace('//LSpmcm9mcHNjcHJwYW1mcFEqNDU2MTIuMzI1NmRmcmdk', '').replace('//ZGY4dmc2OXI5enhXZGx5ZisqZmd4NDU1ZzhmaDl6LWUqUQ==', '').replace('//bHZmeWNnbmRxY3lkcmNnY2ZnKzk1MTQ3Z2ZkZ2YtemQq', '');
			try {
				return decodeURIComponent(atob(data).split("").map(function (c) {
					return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
				}).join(""));
			} catch (e) {
				return '';
			}
		}
		/**
		 * РќР°Р№С‚Рё РїРѕС‚РѕРє
		 * @param {Object} element 
		 * @param {Int} max_quality
		 * @returns string
		 */
		function getFile(element) {
			var file = '';
			var quality = false;
			var max_quality = 1080;
			var path = element.slice(0, element.lastIndexOf('/')) + '/';
			if (file.split('/').pop().replace('.mp4', '') !== max_quality) {
				file = path + max_quality + '.mp4';
			}
			quality = {};
			var mass = [1080, 720, 480, 360];
			mass = mass.slice(mass.indexOf(max_quality));
			mass.forEach(function (n) {
				quality[n + 'p'] = path + n + '.mp4';
			});
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
				quality: []
			};
			if ((extract[0] && extract[0].folder) || object.movie.number_of_seasons) {
				extract.forEach(function (season) {
					filter_items.season.push(season.title);
				});
				extract[choice.season] && extract[choice.season].folder.forEach(function (f) {
					f.folder.forEach(function (t) {
						if (filter_items.voice.indexOf(t.title) == -1) filter_items.voice.push(t.title);
					});
				});
				if (!filter_items.voice[choice.voice]) choice.voice = 0;
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
			if ((extract[0] && extract[0].folder) || object.movie.number_of_seasons) {
				extract.forEach(function (t) {
					if (t.title == filter_items.season[filter_data.season]) {
						t.folder.forEach(function (se) {
							se.folder.forEach(function (eps) {
								if (eps.title == filter_items.voice[choice.voice]) {
									filtred.push({
										file: eps.file,
										episode: parseInt(se.title.match(/\d+/)),
										season: parseInt(t.title.match(/\d+/)),
										quality: '360p ~ 1080p',
										info: ' / ' + Lampa.Utils.shortText(eps.title, 50)
									});
								}
							});
						});
					}
				});
			} else {
				extract.forEach(function (data) {
					filtred.push({
						file: data.file,
						title: data.title,
						quality: '360p ~ 1080p',
						info: '',
						subtitles: data.subtitle ? data.subtitle.split(',').map(function (c) {
							return {
								label: c.split(']')[0].slice(1),
								url: c.split(']')[1]
							};
						}) : false
					});
				});
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
				if (element.season) element.title = object.movie.title + ' - S' + element.season + ' / РЎРµСЂРёСЏ ' + element.episode;
				var hash = Lampa.Utils.hash(element.season ? [element.season, element.episode, object.movie.original_title].join('') : object.movie.original_title);
				var view = Lampa.Timeline.view(hash);
				var item = Lampa.Template.get('onlines_v1', element);
				var hash_file = Lampa.Utils.hash(element.season ? [element.season, element.episode, filter_items.voice[choice.voice]].join('') : object.movie.original_title + element.title);
				item.addClass('video--stream');
				element.timeline = view;
				item.append(Lampa.Timeline.render(view));
				if (Lampa.Timeline.details) {
					item.find('.online__quality').append(Lampa.Timeline.details(view, ' / '));
				}
				if (viewed.indexOf(hash_file) !== -1) item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');

				function contextmenu() {
					component.contextmenu({
						item: item,
						view: view,
						viewed: viewed,
						hash_file: hash_file,
						file: function file(call) {
							call(getFile(element.file));
						}
					});
				}
				var dbtimer,
					dbtime = Date.now();
				item.on('hover:enter', function () {
					if (dbtime < Date.now() - 200) {
						dbtimer = setTimeout(function () {
							if (object.movie.id) Lampa.Favorite.add('history', object.movie, 100);
							if (element.file) {
								var playlist = [];
								var ext = getFile(element.file);
								var first = {
									url: ext.file,
									timeline: view,
									quality: ext.quality,
									subtitles: element.subtitles,
									title: element.season ? element.title : object.movie.title + ' / ' + element.title
								};
								if (element.season) {
									var ex = getFile(element.file);
									items.forEach(function (elem) {
										playlist.push({
											title: elem.title,
											quality: ex.quality,
											url: ex.file,
											subtitles: elem.subtitles,
											timeline: elem.timeline
										});
									});
								} else {
									playlist.push(first);
								}
								if (playlist.length > 1) first.playlist = playlist;
								Lampa.Player.play(first);
								Lampa.Player.playlist(playlist);
								if (viewed.indexOf(hash_file) == -1) {
									viewed.push(hash_file);
									item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
									Lampa.Storage.set('online_view', viewed);
									component.new_seria();
								}
							} else Lampa.Noty.show('РќРµ СѓРґР°Р»РѕСЃСЊ РёР·РІР»РµС‡СЊ СЃСЃС‹Р»РєСѓ');
						}, 200);
						dbtime = Date.now() + 200;
					} else if (dbtime > Date.now()) {
						clearTimeout(dbtimer);
						contextmenu();
					}
				}).on('hover:long', function () {
					contextmenu();
				}).on('hover:focus', function () {
					if (Lampa.Helper) Lampa.Helper.show('online_file', 'РЈРґРµСЂР¶РёРІР°Р№С‚Рµ РєР»Р°РІРёС€Сѓ (РћРљ) РґР»СЏ РІС‹Р·РѕРІР° РєРѕРЅС‚РµРєСЃС‚РЅРѕРіРѕ РјРµРЅСЋ', item);
				});
				component.append(item);
			});
			component.start(true);
		}
	}

	function component(object) {
		var network = new Lampa.Reguest();
		var scroll = new Lampa.Scroll({
			mask: true,
			over: true
		});
		var files = new Lampa.Files(object);
		var filter = new Lampa.Filter(object);
		var balanser = Lampa.Storage.get('onlines_balanser', 'VideoCDN');
		var last_bls = Lampa.Storage.cache('online_last_balanser', 200, {});
		if (last_bls[object.movie.id]) {
			balanser = last_bls[object.movie.id];
		}
		var sources = {
			VideoCDN: new VideoCDN(this, object),
			HDRezka: new HDRezka(this, object),
			Kinobase: new Kinobase(this, object),
			Collaps: new Collaps(this, object),
			Filmix: new Filmix(this, object),
			CDNMovies: new CDNMovies(this, object)
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
		var filter_sources = ['VideoCDN', 'HDRezka', 'Kinobase', 'Collaps', 'Filmix', 'CDNMovies'];
		// С€Р°Р»РѕРІР»РёРІС‹Рµ СЂСѓС‡РєРё
		if (filter_sources.indexOf(balanser) == -1) {
			balanser = 'VideoCDN';
			Lampa.Storage.set('onlines_balanser', 'VideoCDN');
		}
		if(window.innerWidth > 767) scroll.minus();
    else scroll.minus(files.render().find('.files__left'));
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
						if (extended) sources[balanser].reset();
						else _this.start();
					} else {
						sources[balanser].filter(type, a, b);
					}
				} else if (type == 'sort') {
					balanser = a.source;
					Lampa.Storage.set('onlines_balanser', balanser);
					last_bls[object.movie.id] = balanser;
					Lampa.Storage.set('online_last_balanser', last_bls);
					_this.search();
					setTimeout(Lampa.Select.close, 10);
				}
			};
			filter.render().find('.filter--sort span').text('Р‘Р°Р»Р°РЅСЃРµСЂ');
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
			var relise = object.search_date || (object.movie.number_of_seasons ? object.movie.first_air_date : object.movie.release_date) || '0000';
			var year = parseInt((relise + '').slice(0, 4));
			var cors = 'http://corsanywhere.herokuapp.com/';
			var url = 'http://cdn.svetacdn.in/api/short';
			var query = object.search;
			url = Lampa.Utils.addUrlComponent(url, 'api_token=W2NvL86a34Kg2oJXMTf8q67gsgkKuzap');
			var display = function display(json) {
				if (object.movie.imdb_id) {
					var imdb = json.data.filter(function (elem) {
						return elem.imdb_id == object.movie.imdb_id;
					});
					if (imdb.length) json.data = imdb;
				}
				if (json.data && json.data.length) {
					if (json.data.length == 1 || object.clarification) {
						_this2.extendChoice();
						if (balanser == 'VideoCDN' || balanser == 'Filmix') sources[balanser].search(object, json.data);
						else sources[balanser].search(object, json.data[0].kp_id || json.data[0].filmId, json.data);
					} else {
						var card = json.data.find(function (c) {
							return c.year == year;
						});
						if (!card) card = json.data.find(function (c) {
							return c.title == query;
						});
						if (card) {
							if (balanser == 'VideoCDN' || balanser == 'Filmix') sources[balanser].search(object, card);
							else sources[balanser].search(object, card.kp_id || card.filmId, card);
						} else {
							_this2.similars(json.data);
							_this2.loading(false);
						}
					}
				} else if (balanser !== 'VideoCDN') {
					network["native"](cors + 'https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=' + encodeURIComponent(query), function (json) {
						json.data = json.films;
						display(json);
					}, function (a, c) {
						_this2.empty(network.errorDecode(a, c));
					}, false, {
						headers: {
							'X-API-KEY': '2d55adfd-019d-4567-bbf7-67d503f61b5a'
						}
					});
				} else _this2.empty('РџРѕ Р·Р°РїСЂРѕСЃСѓ (' + query + ') РЅРµС‚ СЂРµР·СѓР»СЊС‚Р°С‚РѕРІ');
			};
			var pillow = function pillow(a, c) {
				network.timeout(1000 * 5);
				if (balanser !== 'VideoCDN') {
					network["native"](cors + 'https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=' + encodeURIComponent(query), function (json) {
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
					if (json.data && json.data.length) display(json);
					else {
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
		this.num_word = function (value, words) {
			value = Math.abs(value) % 100;
			var num = value % 10;
			if (value > 10 && value < 20) return words[2];
			if (num > 1 && num < 5) return words[1];
			if (num == 1) return words[0];
			return words[2];
		};
		this.similars = function (json) {
			var _this3 = this;
			json.forEach(function (elem) {
				var year = elem.start_date || elem.year || '';
				elem.title = elem.title || elem.ru_title || elem.nameRu || elem.nameEn;
				elem.quality = year ? (year + '').slice(0, 4) : '----';
				var transl = elem.translations ? ' - - ' + String(elem.translations).split(',').slice(0, 2) : '';
				var count_s = elem.seasons_count ? 'РЎРµР·РѕРЅ' + _this3.num_word(elem.seasons_count, ['', 'Р°', 'РѕРІ']) + ' ' + elem.seasons_count : '';
				var count_eps = elem.episodes_count ? elem.episodes_count + ' СЌРїРёР·РѕРґ' + _this3.num_word(elem.episodes_count, ['', 'Р°', 'РѕРІ']) : '';
				elem.info = (elem.type == 'serial' ? (' / CРµСЂРёР°Р» - ' + count_s + ' РёР· РЅРёС… ' + count_eps) : elem.type == 'TV_SHOW' ? ' - РўРІ-РЁРѕСѓ' : elem.type == 'FILM' || elem.type == 'film' ? ' - Р¤РёР»СЊРј' : '') + transl;
				var item = Lampa.Template.get('online_folder', elem);
				item.on('hover:enter', function () {
					_this3.activity.loader(true);
					_this3.reset();
					object.search_date = year;
					selected_id = elem.id;
					_this3.extendChoice();
					var ids = elem.kp_id || elem.imdb_id;
					if (balanser == 'VideoCDN' || balanser == 'Filmix') sources[balanser].search(object, [elem]);
					else sources[balanser].search(object, ids || elem.filmId, [elem]);
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
			if (status) this.activity.loader(true);
			else {
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
			filter.set('filter', select);
			filter.set('sort', filter_sources.map(function (e) {
				return {
					title: e,
					source: e,
					selected: e == balanser
				};
			}));
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
			var _this = this;
			var need = Lampa.Storage.get('online_filter', '{}'),
				select = [];
			for (var i in need) {
				if (filter_items[i] && filter_items[i].length) {
					if (i == 'voice') {
						select.push(filter_translate[i] + ': ' + filter_items[i][need[i]]);
					} else if (i !== 'source') {
						if (filter_items.season.length >= 1) {
							select.push(filter_translate.season + ': ' + filter_items[i][need[i]]);
						}
					}
				}
			}
			filter.chosen('filter', select);
			filter.chosen('sort', [balanser]);
			_this.new_seria();
		};
	this.new_seria = function () {
			if (object.movie.number_of_seasons) {
				setTimeout(function () {
				  if ($('body').find('.video--stream').length !== 0) {
						if ($('body').find('.video--stream:last-child .torrent-item__viewed').length == 1 || $('body').find('.video--stream:last-child .time-line.hide').length == 0) {
							var new_seria = "<div class='card--viewed' style='right: -0.6em;position: absolute;background: #168FDF;color: #fff;top: 0.8em;padding: 0.4em 0.4em;font-size: 1.2em;-webkit-border-radius: 0.3em;-moz-border-radius: 0.3em;border-radius: 0.3em;'>РџСЂРѕСЃРјРѕС‚СЂРµРЅРѕ</div>";
							$('body').find('.full-start__poster').append(new_seria);
							$('body').find('.card--new_ser').remove();
						} else {
							var new_seria = "<div class='card--new_ser' style='right: -0.6em;position: absolute;background: #168FDF;color: #fff;top: 0.8em;padding: 0.4em 0.4em;font-size: 1.2em;-webkit-border-radius: 0.3em;-moz-border-radius: 0.3em;border-radius: 0.3em;'>РќРѕРІР°СЏ СЃРµСЂРёСЏ</div>";
							$('body').find('.full-start__poster').append(new_seria);
							$('body').find('.card--viewed').remove();
						}
					}
					last_view(object.movie);
				}, 50);
			}
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
			var _this = this;

			function show(extra) {
				var enabled = Lampa.Controller.enabled().name;
				var menu = [{
					title: 'РџРѕРјРµС‚РёС‚СЊ',
					subtitle: 'РџРѕРјРµС‚РёС‚СЊ СЃ С„Р»Р°РіРѕРј (РїСЂРѕСЃРјРѕС‚СЂРµРЅРѕ)',
					mark: true
				}, {
					title: 'РЎРЅСЏС‚СЊ РѕС‚РјРµС‚РєСѓ',
					subtitle: 'РЎРЅСЏС‚СЊ РѕС‚РјРµС‚РєСѓ (РїСЂРѕСЃРјРѕС‚СЂРµРЅРѕ)',
					clearmark: true
				}, {
					title: 'РЎР±СЂРѕСЃРёС‚СЊ С‚Р°Р№РјРєРѕРґ',
					timeclear: true
				}];
				if (extra) {
					menu.push({
						title: 'РљРѕРїРёСЂРѕРІР°С‚СЊ СЃСЃС‹Р»РєСѓ РЅР° РІРёРґРµРѕ',
						copylink: true
					});
				}
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
							_this.new_seria();
							Lampa.Noty.show('РћС‚РјРµС‡РµРЅРѕ РєР°Рє РЅРµ РїСЂРѕСЃРјРѕС‚СЂРµРЅРЅРѕ');
						}
						if (a.mark) {
							if (params.viewed.indexOf(params.hash_file) == -1) {
								params.viewed.push(params.hash_file);
								params.item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
								_this.new_seria();
								Lampa.Storage.set('online_view', params.viewed);
								Lampa.Noty.show('РћС‚РјРµС‡РµРЅРѕ РєР°Рє РЅРµ РїСЂРѕСЃРјРѕС‚СЂРµРЅРЅРѕ');
							}
						}
						if (a.timeclear) {
							params.view.percent = 0;
							params.view.time = 0;
							params.view.duration = 0;
							_this.new_seria();
							Lampa.Timeline.update(params.view);
							Lampa.Arrays.remove(params.viewed, params.hash_file);
							params.item.find('.torrent-item__viewed').remove();
							Lampa.Storage.set('online_view', params.viewed);
							Lampa.Noty.show('РўР°Р№РјРєРѕРґ СЃР±СЂРѕС€РµРЅ');
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
			var _this5 = this;
			if (first_select) {
				var last_views = scroll.render().find('.selector.video--stream').find('.torrent-item__viewed').parent().last();
				if (object.movie.number_of_seasons && last_views.length) last = last_views.eq(0)[0]; 
				else last = scroll.render().find('.selector').eq(3)[0];
			}
			Lampa.Controller.add('content', {
				toggle: function toggle() {
					Lampa.Controller.collectionSet(scroll.render(), files.render());
					Lampa.Controller.collectionFocus(last || false, scroll.render());
				},
				up: function up() {
					if (Navigator.canmove('up')) {
						if (scroll.render().find('.selector').slice(3).index(last) == 0 && last_filter) {
							Lampa.Controller.collectionFocus(last_filter, scroll.render());
						} else Navigator.move('up');
					} else Lampa.Controller.toggle('head');
				},
				down: function down() {
					Navigator.move('down');
				},
				right: function right() {
					if (Navigator.canmove('right')) Navigator.move('right');
					else filter.show('Р¤РёР»СЊС‚СЂ', 'filter');
				},
				left: function left() {
					if (Navigator.canmove('left')) Navigator.move('left');
					else Lampa.Controller.toggle('menu');
				},
				back: function back() {
					_this5.new_seria();
					Lampa.Activity.backward();
				}
			});
			Lampa.Controller.toggle('content');
		};
		this.render = function () {
			return files.render();
		};
		this.pause = function () {};
		this.stop = function () {};
		this.destroy = function () {
			network.clear();
			files.destroy();
			scroll.destroy();
			network = null;
			sources.VideoCDN.destroy();
			sources.HDRezka.destroy();
			sources.Kinobase.destroy();
			sources.Collaps.destroy();
			sources.Filmix.destroy();
			sources.CDNMovies.destroy();
		};
	}

  var player;
  var html$7;
  var timer$1;

  function create$f(id) {
    html$7 = $('<div class="youtube-player"><div id="youtube-player"></div><div id="youtube-player__progress" class="youtube-player__progress"></div></div>');
    $('body').append(html$7);
    player = new YT.Player('youtube-player', {
      height: window.innerHeight,
      width: window.innerWidth,
      playerVars: {
        'controls': 0,
        'showinfo': 0,
        'autohide': 1,
        'modestbranding': 1,
        'autoplay': 1
      },
      videoId: id,
      events: {
        onReady: function onReady(event) {
          event.target.playVideo();
          update$2();
        },
        onStateChange: function onStateChange(state) {
          if (state.data == 0) {
            Controller.toggle('content');
          }
        }
      }
    });
  }

  function update$2() {
    timer$1 = setTimeout(function () {
      var progress = player.getCurrentTime() / player.getDuration() * 100;
      $('#youtube-player__progress').css('width', progress + '%');
      update$2();
    }, 400);
  }

  function play(id) {
    create$f(id);
    Lampa.Controller.add('youtube', {
      invisible: true,
      toggle: function toggle() {},
      right: function right() {
        player.seekTo(player.getCurrentTime() + 10, true);
      },
      left: function left() {
        player.seekTo(player.getCurrentTime() - 10, true);
      },
      enter: function enter() {},
      gone: function gone() {
        destroy$2();
      },
      back: function back() {
        Lampa.Controller.toggle('content');
      }
    });
    Lampa.Controller.toggle('youtube');
  }

  function destroy$2() {
    clearTimeout(timer$1);
    player.destroy();
    html$7.remove();
    html$7 = null;
  }

  var YouTube = {
    play: play
  };


	function forktv(object) {
		var network = new Lampa.Reguest();
		var scroll = new Lampa.Scroll({
			mask: true,
			over: true,
			step: 250
		});
		var items = [];
		var html = $('<div></div>');
		var body = $('<div class="category-full"></div>');
		var forktv_id = Lampa.Storage.cache('forktv_id', 1, []);
		var info;
		var last;
		var waitload = false;
		
		this.GetCode = function (create, page) {
		  var _this = this;
		  network.clear(); 
      network.timeout(10000);
      network.silent('https://get.geojs.io/v1/ip/geo.js', function (found) {
		    var user_dev_code = 'box_client=lg&box_mac=' + forktv_id + '&initial=ForkXMLviewer|' + forktv_id + '|YAL-L41%20sdk%2029|87b13d368f81872b|MTY1MjI4NTM0NAR=E1341|7AD953401F39875|androidapi|0|Android-device_YAL-L41_sdk_29&vr=0&platform=android-device&country='+found.country_code+'&tvp=0&hw=1.6&cors=android-device';
        if (create) _this.go(user_dev_code);
        else _this.next(page, user_dev_code);
      }, function (a, c) {
        Lampa.Noty.show(network.errorDecode(a, c));
      }, false, {
        dataType: 'jsonp',
        jsonpCallback: 'geoip'
      }); 
		};
		this.create = function () {
		  var _this = this;
		  _this.GetCode(true);
		};
		this.go = function (user_dev) {
			var _this = this;
			this.activity.loader(true);
			if (object.submenu) _this.build(object.url);
			else {
				var u = object.url && object.url.indexOf('?') > -1 ? '&' : '/?';
        network.silent(object.url + u + user_dev, this.build.bind(this), function () {
          _this.empty();			
				});
			}
			return this.render();
		};
		this.next = function (next_page_url, user_dev) {
			var _this2 = this;
			if (waitload) return;
			if (object.page < 90) {
				waitload = true;
				object.page++;
				network.clear();
				network.timeout(10000);
				network["native"](next_page_url+ '&' + user_dev, function (result) {
					_this2.append(result);
					if (result.channels.length) waitload = false;
					Lampa.Controller.enable('content');
					_this2.activity.loader(false);
        }, function (a, c) {
          Lampa.Noty.show(network.errorDecode(a, c));
        }); 
			}
		};
		this.stream = function (data, title, youtube) {
			if (data.indexOf('torrstream') > -1 || data.indexOf('torrent') > -1) {
				//console.log (data.split('magnet=')[1].split('&tid')[0].replace('magnet%3a%3fxt%3durn%3abtih%3a', 'magnet:?xt=urn:btih:').replace('%26dn%3d', '&dn=').replace('%3a', ':').replace('%26tr%3d', '&tr').replace('%3a%2f%2f', '://').replace('%2f', '/').replace('%2f','/'))
			  network.timeout(10000);
				network.silent(data, function (json) {
				if(json.channels.length >0){
					var data = json.channels[0];
  				var video = {
  					title: data.title,
  					url: data.stream_url
  				};
  				Lampa.Player.play(video);
  				Lampa.Player.playlist([video]);
				} else Lampa.Noty.show('РќРµ СѓРґР°Р»РѕСЃСЊ РїРѕР»СѓС‡РёС‚СЊ С„Р°Р№Р»');
				}, function (a, e) {
  			  Lampa.Noty.show(network.errorDecode(a, e));
  			}, false, {
  				dataType: 'json'
  			});
			  
			} else if (data && data.match(/magnet|videos|stream\?|mp4|m3u8/i)) {
				var video = {
					title: title,
					url: data
				};
				Lampa.Player.play(video);
				Lampa.Player.playlist([video]);
			} else if (youtube) {
		   var id = youtube.split('=')[1];
		   YouTube.play(id);
			}
		};
		this.append = function (data) {
			var _this3 = this;
			var bg_img = JSON.stringify(data).replace('background-image', 'background_image');
		      bg_img = JSON.parse(bg_img);
		  bg_img.background_image && Lampa.Background.immediately(bg_img.background_image);
			if (data.channels && data.channels.length == 0) {
			  Lampa.Noty.show('РќРёС‡РµРіРѕ РЅРµ РЅР°Р№РґРµРЅРѕ'); 
			} else {
			var json = data.channels && data.menu && data.menu.length > 0 && data.menu[0].title != 'РўСЂРµР№Р»РµСЂ' ? data.menu.concat(data.channels) : data.channels;
	    
	   json = JSON.stringify(json).replace(/<br \/>|\)|\(|%20/g, '');
	   JSON.parse(json).forEach(function (element) {
			 	var stream = element.stream_url ? element.stream_url : element.playlist_url;
				var time = $($(element.description).children()[0]).parent().text(); 
  		      time = time.match(/РџСЂРѕРґРѕР»Р¶РёС‚РµР»СЊРЅРѕСЃС‚СЊ: (.*?)?./i);
  		      time = time && time.shift()+' - '||'';
		   	var descr = !element.ident && element.description && $($(element.description).children()[1]) ? $($(element.description).children()[1]).text().slice(0,130) || $($(element.description).children()[0]).parent().text().slice(0,130): '';
		  	var image = element.before && element.before.indexOf('src') > -1 ? $('img', element.before).attr('src') : 
				            element.template && element.template.indexOf('src') > -1 ? $('img', element.template).attr('src') : 
				            element.description && element.description.indexOf('src') > -1 ? $('img', element.description).attr('src') : 
				            element.logo_30x30 && element.logo_30x30.indexOf('png') > -1 ? element.logo_30x30 : 
				            element.details && element.details.poster ? element.details.poster : 
				            './img/icons/film.svg';
				var card = Lampa.Template.get('card', {
					title: element.title||element.details&&element.details.name,
					release_year: time
				});
				card.addClass(isNaN(element.ident) &&  
				( 
  				element.home ||
  				element.playlist_url&&element.playlist_url.indexOf('view?') == - 1 &&
				  element.playlist_url&&element.playlist_url.indexOf('voice?') == - 1 &&
				  element.playlist_url&&element.playlist_url.indexOf('magnet') == - 1 &&
				  element.playlist_url&&element.playlist_url.indexOf('details?') == - 1 && 
				  element.details != undefined || 
				(
  				object.title.indexOf('HDGO') > - 1 || 
				  element.logo_30x30 && element.logo_30x30.match(/succes|server|info|cloud|translate|error|trailer|uhd|webcam|mediafile|viewed|new|top|country|genre|similarmenu|filter|folder/g) != null
				 && (
  				  element.description == undefined || 
  				  element.logo_30x30.indexOf('succes') > - 1 ||
  				  element.logo_30x30.indexOf('server') > - 1 ||
  				  element.logo_30x30.indexOf('info') > - 1 || 
  				  element.logo_30x30.indexOf('cloud') > - 1 || 
  				  element.logo_30x30.indexOf('mediafile') > - 1 || 
  				  element.logo_30x30.indexOf('uhd') > - 1 || 
  				  element.logo_30x30.indexOf('folder') > - 1 &&
  				  element.description.indexOf('src') > - 1  && 
  				  bg_img&&bg_img.background_image.indexOf('18') > - 1  && 
  				  element.playlist_url&&element.playlist_url.indexOf('view?') > - 1 ||
  				  element.playlist_url&&element.playlist_url.indexOf('cat=pornstars') == - 1 && 
  				  element.playlist_url&&element.playlist_url.indexOf('cat=models') == - 1 &&
  				  element.playlist_url&&element.playlist_url.indexOf('vporn/list?cat') == - 1 &&
  				  element.playlist_url&&element.playlist_url.indexOf('list?cat') > - 1 ||
  				  element.logo_30x30&&element.logo_30x30.indexOf('webcam') > - 1 || 
  				  element.playlist_url&&element.playlist_url.indexOf('channels') > - 1 && 
  				  element.playlist_url&&element.playlist_url.indexOf('cat=tags') > - 1 &&  
  				  element.playlist_url&&element.playlist_url.indexOf('details?') > - 1 &&
  				  !element.ident && element.description && element.description.indexOf('src') > -1 || 
  				  !element.description && element.description.indexOf('src') == -1
				  )
				  )) ? 'card--collection' : 'card--category');
		
				var img = card.find('.card__img')[0];
				img.onload = function () {
					card.addClass('card--loaded');
				};
				img.onerror = function (e) {
					img.src = './img/img_broken.svg';
				};
				var picture = image && image.indexOf('yandex') > - 1 ? 'https://cors.eu.org/' + image : image && image.indexOf('svg') > - 1 ? image : image;
				img.src = image;
				card.on('hover:focus', function () {
				  if (this.className.indexOf('card--category') > - 1) {
  				  if (Lampa.Helper) Lampa.Helper.show('online_file', 'РЈРґРµСЂР¶РёРІР°Р№С‚Рµ РєР»Р°РІРёС€Сѓ (РћРљ) РґР»СЏ РїСЂРѕСЃРјРѕС‚СЂР° РѕРїРёСЃР°РЅРёСЏ', card);
  					Lampa.Background.change(picture);
				  } 
					last = card[0];
					scroll.update(card, true);
					info.find('.info__title').text(element.title);
					info.find('.info__title-original').text(descr);
					var maxrow = Math.ceil(items.length / 7) - 1;
					if (Math.ceil(items.indexOf(card) / 7) >= maxrow) if(data.next_page_url) _this3.GetCode(false, data.next_page_url);
				}).on('hover:enter', function () {
				  if (stream || data.channels.length > 0){
  					if (element.event || (stream && stream.match(/youtube|stream\?|mp4|m3u8/i))) {
  						_this3.stream(stream, element.title, element.infolink);
  					} else if (element.search_on){
  					  Lampa.Input.edit({
                value: element.playlist_url.indexOf('newserv') >-1 && window.localStorage.getItem('server_ip') ? Lampa.Storage.get('server_ip', '') : ''
              }, function (new_value) {
                if(element.playlist_url.indexOf('newserv') > -1)Lampa.Storage.set('server_ip', new_value);
                var query = element.playlist_url.indexOf('newserv') >-1 ? Lampa.Storage.get('server_ip', '') : new_value;
    					 	var u = element.playlist_url && element.playlist_url.indexOf('?') > -1 ? '&' : '/?';
    					  network.silent(element.playlist_url + u +'search=' + query, function (json) {
                 if (json.channels[1]){
                 	Lampa.Activity.push({
      							title: element.title,
      							url: json,
      							submenu: true,
      							component: 'forktv',
      							page: 1
      						});
                 }else{
                 	Lampa.Modal.open({
                 	  title:'', 
        						size:'medium', 
        						html: Lampa.Template.get('error', {
                      title: 'РћС€РёР±РєР°',
                      text: json.channels[0].title
                    }),
        						onBack: function onBack() {
        							Lampa.Modal.close();
        							Lampa.Controller.toggle('content');
        						}
        					});
      					  } 
        				});
        		  });
  					} else if (stream == ''){
					  	Lampa.Modal.open({
    						title: element.title,
    						size:'medium', 
    						html: $('<div style="font-size:4vw">' +$(element.description)[0].innerHTML+'</div>'),
    						onBack: function onBack() {
    							Lampa.Modal.close();
    							Lampa.Controller.toggle('content');
    						}
    					});
  					} else if(stream){
  						var title = stream == 'submenu' ? element.submenu && element.submenu[0].title : 
  						            element.details && element.details.title ? element.details.title : 
  						            element.title && element.title.indexOf('l-count') > -1 ? element.title.split(' ').shift() : 
  						            element.details && element.details.name ? element.details.name : 
  						            element.title;
  						var url = stream == 'submenu' ? {
  							channels: element.submenu
  						} : stream;
  						Lampa.Activity.push({
  							title: title,
  							url: url,
  							submenu: stream == 'submenu',
  							component: 'forktv',
  							page: 1
  						});
  					} else if (element.description&&element.description.indexOf('РґРѕСЃС‚СѓРїР°')>-1){
  				    Lampa.Modal.open({
             	  title: element.title, 
    						size:'medium', 
    						html: $(element.description||element.template),
    						onBack: function onBack() {
    							Lampa.Modal.close();
    							Lampa.Controller.toggle('content');
    						}
          	  }); 
  				  } 
					}
				}).on('hover:long', function () {
				  if(stream && stream.match(/stream\?|mp4|m3u8/i)) {
  					Lampa.Utils.copyTextToClipboard(stream, function () {
  				  Lampa.Noty.show('РЎСЃС‹Р»РєР° СЃРєРѕРїРёСЂРѕРІР°РЅР°');
  					}, function () {
  						Lampa.Noty.show('РћС€РёР±РєР° РїСЂРё РєРѕРїРёСЂРѕРІР°РЅРёРё');
  					});
				  }
				  if (stream&&stream.match(/viewtube|details|seasonlist|view\?|voice|magnet|stream\?|mp4|m3u8/i) && (element.description || element.template)){
				    Lampa.Modal.open({
           	  title: element.title, 
  						size:'medium', 
  						html: $(element.description||element.template),
  						onBack: function onBack() {
  							Lampa.Modal.close();
  							Lampa.Controller.toggle('content');
  						}
        	  }); 
				  }
				});
				body.append(card);
				items.push(card);
			});
			}
		};
		this.build = function (data) {
			info = Lampa.Template.get('info');
			info.find('.info__rate,.info__right').remove();
			if (data.channels&&data.channels.length) {
			  scroll.render().addClass('layer--wheight').data('mheight', info);
				scroll.minus();
				html.append(info);
				html.append(scroll.render());
				this.append(data);
				scroll.append(body);
				this.activity.loader(false);
				this.activity.toggle();
			} else {
				html.append(scroll.render());
				this.empty();
			}
		};
		this.empty = function () {
			var empty = new Lampa.Empty();
			scroll.append(empty.render());
			this.start = empty.start;
			this.activity.loader(false);
			this.activity.toggle();
		};
		this.start = function () {
			Lampa.Controller.add('content', {
				toggle: function toggle() {
					Lampa.Controller.collectionSet(scroll.render());
					Lampa.Controller.collectionFocus(last || false, scroll.render());
				},
				left: function left() {
					if (Navigator.canmove('left')) Navigator.move('left');
					else Lampa.Controller.toggle('menu');
				},
				right: function right() {
					Navigator.move('right');
				},
				up: function up() {
					if (Navigator.canmove('up')) Navigator.move('up');
					else Lampa.Controller.toggle('head');
				},
				down: function down() {
					if (Navigator.canmove('down')) Navigator.move('down');
				},
				back: function back() {
					Lampa.Activity.backward();
				}
			});
			Lampa.Controller.toggle('content');
		};
		this.pause = function () {};
		this.stop = function () {};
		this.render = function () {
			return html;
		};
		this.destroy = function () {
			network.clear();
			scroll.destroy();
			if (info) info.remove();
			html.remove();
			body.remove();
			network = null;
			items = null;
			html = null;
			body = null;
			info = null;
		};
	}

  function collection(object) {
		var network = new Lampa.Reguest();
		var scroll = new Lampa.Scroll({
			mask: true,
			over: true,
			step: 250
		});
		var items = [];
		var html = $('<div></div>');
		var body = $('<div class="category-full"></div>');
		var cors = 'http://corsanywhere.herokuapp.com/';
		var headers = {
			"accept": "*/*",
			"accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
			"user-agent": "WebOS; Linux/SmartTV:Mozilla/5.0 (WebOS; Linux/SmartTV; x64; rv:99.0) Gecko/20100101 Firefox/99.0",
			"x-requested-with": "XMLHttpRequest"
		};
		var info;
		var last;
		var waitload = false;
		var relises = [];
		var total_pages;
		this.create = function () {
			var _this = this;
			if (object.cards && !object.card_cat || !Lampa.Storage.field('light_version') && object.card_cat || Lampa.Storage.field('light_version') && object.cards) {
				this.activity.loader(true);
				network["native"](cors + object.url, function (str) {
					var data = _this.card(str);
					_this.build(data);
				}, function (a, c) {
					Lampa.Noty.show(network.errorDecode(a, c));
				}, false, {
					dataType: 'text',
					headers: headers
				});
			} else _this.build(object.data);
			return this.render();
		};
		this.next = function (page) {
			var _this2 = this;
			if (total_pages == 0) waitload = true;
			if (waitload) return;
			waitload = true;
			object.page++;
			network.clear();
			network.timeout(1000 * 40);
			network["native"](cors + page, function (result) {
				var data = _this2.card(result);
				object.data = data;
				_this2.append(data);
				if (data.card.length) waitload = false;
				Lampa.Controller.toggle('content');
				_this2.activity.loader(false);
			}, function (a, c) {
				console.log(a);
				Lampa.Noty.show(network.errorDecode(a, c));
			}, false, {
				dataType: 'text',
				headers: headers
			});
		};
		this.append = function (data) {
			var _this2 = this;
			data.card.forEach(function (element) {
				var card = Lampa.Template.get('card', {
					title: element.title,
					release_year: object.cards || !object.card_cat ? element.year : element.quantity
				});
				card.addClass(object.source == 'filmix' || !object.card_cat || object.cards ? 'card--category' : 'card--collection');
				if (object.card) {
					card.find('.card__age').text('');
				}
				var img = card.find('.card__img')[0];
				img.onload = function () {
					card.addClass('card--loaded');
				};
				img.onerror = function (e) {
					img.src = './img/img_broken.svg';
				};
				var picture = Lampa.Storage.field('proxy_other') === false ? element.img : 'http://proxy.cub.watch/img/' + element.img;
				img.src = picture;
				card.on('hover:focus', function () {
					last = card[0];
					scroll.update(card, true);
					if (!Lampa.Storage.field('light_version')) {
						var maxrow = Math.ceil(items.length / 7) - 1;
						if (Math.ceil(items.indexOf(card) / 7) >= maxrow) _this2.next(data.page);
					}
				});
				card.on('hover:enter', function (target, card_data) {
					if ((Lampa.Storage.field('light_version') && !object.cards) && !object.card_cat || object.cards) {
						Lampa.Api.search({
							query: encodeURIComponent(element.title_org)
						}, function (find) {
							var finded = _this2.finds(element, find);
							if (finded) {
								Lampa.Activity.push({
									url: '',
									component: 'full',
									id: finded.id,
									method: finded.name ? 'tv' : 'movie',
									card: finded
								});
							} else {
								Lampa.Noty.show('РќРµ СѓРґР°Р»РѕСЃСЊ РЅР°Р№С‚Рё С„РёР»СЊРј.');
								Lampa.Controller.toggle('content');
							}
						}, function () {
							Lampa.Noty.show('РќРµ СѓРґР°Р»РѕСЃСЊ РЅР°Р№С‚Рё С„РёР»СЊРј.');
							Lampa.Controller.toggle('content');
						});
					} else {
						Lampa.Activity.push({
							title: element.title,
							url: element.url,
							component: 'collection',
							cards: true,
							source: object.source,
							page: 1
						});
					}
				});
				body.append(card);
				items.push(card);
			});
		};
		this.build = function (data) {
			if (data.card.length) {
				scroll.minus();
				html.append(scroll.render());
				this.append(data);
				if (Lampa.Storage.field('light_version')) this.more(data);
				scroll.append(body);
				this.activity.loader(false);
				this.activity.toggle();
			} else {
				html.append(scroll.render());
				this.empty();
			}
		};
		this.empty = function () {
			var empty = new Lampa.Empty();
			scroll.append(empty.render());
			this.start = empty.start;
			this.activity.loader(false);
			this.activity.toggle();
		};
		this.more = function (data) {
			var _this = this;
			var more = $('<div class="category-full__more selector"><span>РџРѕРєР°Р·Р°С‚СЊ РµС‰Рµ</span></div>');
			more.on(!Lampa.Platform.get() ? 'hover:enter' : 'hover:focus', function (e) {
				Lampa.Controller.collectionFocus(last || false, scroll.render());
				var next = Lampa.Arrays.clone(object);
				if (data.total_pages == 0) {
					more.remove();
					return;
				}
				network.clear();
				network.timeout(1000 * 20);
				network["native"](cors + data.page, function (result) {
					var card = _this.card(result);
					next.data = card;
					if (object.cards) next.cards = false;
					delete next.activity;
					next.page++;
					if (card.card.length == 0) more.remove();
					else Lampa.Activity.push(next);
				}, function (a, c) {
					Lampa.Noty.show(network.errorDecode(a, c));
				}, false, {
					dataType: 'text',
					headers: headers
				});
			});
			body.append(more);
		};
		this.card = function (str) {
			var card = [];
			var page;
			str = str.replace(/\n/g, '');
			if (object.source == 'rezka') {
				var h = $('.b-content__inline_item', str).length ? $('.b-content__inline_item', str) : $('.b-content__collections_item', str);
				total_pages = $('.b-navigation', str).find('a:last-child').length;
				page = $('.b-navigation', str).find('a:last-child').attr('href');
				$(h).each(function (i, html) {
					card.push({
						title: $('a:eq(1)', html).text().split(' / ').shift() || $('.title', html).text(),
						title_org: $('a:eq(1)', html).text().split(' / ').shift(),
						url: $('a', html).attr('href'),
						img: $('img', html).attr('src'),
						quantity: $('.num', html).text() + ' РІРёРґРµРѕ',
						year: $('div:eq(2)', html).text().split(' - ').shift()
					});
				});
			} else if (object.source == 'filmix') {
				var d = $('.playlist-articles', str);
				var str = d.length ? d.html() : $('.m-list-movie', str).html();
				$(str).each(function (i, html) {
					if (html.tagName == 'DIV') {
						page = $(html).find('.next').attr('href');
						total_pages = $(html).find('a:last-child').length;
					}
					if (html.tagName == 'ARTICLE') card.push({
						title: $('.m-movie-title', html).text() || ($('.poster', html).attr('alt') && $('.poster', html).attr('alt').split(',').shift()),
						title_org: $('.m-movie-original', html).text() || $('.origin-name', html).text(),
						url: $('a', html).attr('href'),
						img: $('img', html).attr('src'),
						quantity: $('.m-movie-quantity', html).text() || $('.count', html).text(),
						year: $('.grid-item', html).text() || ($('.poster', html).attr('alt') && $('.poster', html).attr('alt').split(',').pop()),
					});
				});
			}
			return {
				card: card,
				page: page,
				total_pages: total_pages
			};
		};
		this.finds = function (element, find) {
			var finded;
			var filtred = function filtred(items) {
				for (var i = 0; i < items.length; i++) {
					var item = items[i];
					if ((element.title_org == (item.original_title || item.original_name) || element.title == (item.title || item.name)) && parseInt(element.year) == (item.first_air_date || item.release_date).split('-').shift()) {
						finded = item;
						break;
					}
				}
			};
			if (find.movie && find.movie.results.length) filtred(find.movie.results);
			if (find.tv && find.tv.results.length && !finded) filtred(find.tv.results);
			return finded;
		};
		this.start = function () {
			Lampa.Controller.add('content', {
				toggle: function toggle() {
					Lampa.Controller.collectionSet(scroll.render());
					Lampa.Controller.collectionFocus(last || false, scroll.render());
				},
				left: function left() {
					if (Navigator.canmove('left')) Navigator.move('left');
					else Lampa.Controller.toggle('menu');
				},
				right: function right() {
					Navigator.move('right');
				},
				up: function up() {
					if (Navigator.canmove('up')) Navigator.move('up');
					else Lampa.Controller.toggle('head');
				},
				down: function down() {
					if (Navigator.canmove('down')) Navigator.move('down');
				},
				back: function back() {
					Lampa.Activity.backward();
				}
			});
			Lampa.Controller.toggle('content');
		};
		this.pause = function () {};
		this.stop = function () {};
		this.render = function () {
			return html;
		};
		this.destroy = function () {
			network.clear();
			Lampa.Arrays.destroy(items);
			scroll.destroy();
			html.remove();
			body.remove();
			network = null;
			items = null;
			html = null;
			body = null;
			info = null;
		};
	}

  function last_view(data) {
  		var episodes = Lampa.TimeTable.get(data);
  		var viewed;
  		episodes.forEach(function (ep) {
  			var hash = Lampa.Utils.hash([ep.season_number, ep.episode_number, data.original_title].join(''));
  			var view = Lampa.Timeline.view(hash);
  			if (view.percent) viewed = {
  				ep: ep,
  				view: view
  			};
  		});
  		if (viewed) {
  			var ep = viewed.ep.episode_number;
  			var se = viewed.ep.season_number;
  			var last_view = 'S' + se + ':E' + ep;
  			$('body').find('.full-start__poster').append(Lampa.Timeline.render(viewed.view)).append("<div class='card--last_view' style='right: -0.6em;position: absolute;background: #168FDF;color: #fff;top: 0.6em;padding: 0.4em 0.4em;font-size: 1.2em;-webkit-border-radius: 0.3em;-moz-border-radius: 0.3em;border-radius: 0.3em;'><div style='float:left;margin:-5px 0 -4px -4px' class='card__icon icon--history'></div>" + last_view + "</div>");
  		  if ($('body').find('.video--stream').length > 0 && $('body').find('.card--new_ser, .card--viewed').length > 0)
  		  	$('body').find('.full-start__poster .time-line, .card--last_view').remove();
  		} else $('body').find('.full-start__poster .time-line, .card--last_view').remove();
  	}

	function startPlugin() {
		window.plugin = true;
		Lampa.Component.add('onlines_v1', component);
		Lampa.Component.add('Radio_n', Radio_n);
    Lampa.Component.add('forktv', forktv);
    Lampa.Component.add('collection', collection);
		Lampa.Template.add('onlines_v1', "<div class='online selector'> <div class='online__body'><div style='position: absolute;left: 0;top: -0.3em;width: 2.4em;height: 2.4em'>    <svg style='height: 2.4em; width:  2.4em;' viewBox='0 0 128 128' fill='none' xmlns='http://www.w3.org/2000/svg'>   <circle cx='64' cy='64' r='56' stroke='white' stroke-width='16'/>   <path d='M90.5 64.3827L50 87.7654L50 41L90.5 64.3827Z' fill='white'/>    </svg></div><div class='online__title' style='padding-left: 2.1em;'>{title}</div><div class='online__quality' style='padding-left: 3.4em;'>{quality}{info}</div> </div></div>");
		Lampa.Template.add('online_folder', "<div class='online selector'> <div class='online__body'><div style='position: absolute;left: 0;top: -0.3em;width: 2.4em;height: 2.4em'>    <svg style='height: 2.4em; width:  2.4em;' viewBox='0 0 128 112' fill='none' xmlns='http://www.w3.org/2000/svg'>   <rect y='20' width='128' height='92' rx='13' fill='white'/>   <path d='M29.9963 8H98.0037C96.0446 3.3021 91.4079 0 86 0H42C36.5921 0 31.9555 3.3021 29.9963 8Z' fill='white' fill-opacity='0.23'/>   <rect x='11' y='8' width='106' height='76' rx='13' fill='white' fill-opacity='0.51'/>    </svg></div><div class='online__title' style='padding-left: 2.1em;'>{title}</div><div class='online__quality' style='padding-left: 3.4em;'>{quality}{info}</div> </div>\n    </div>");
		Lampa.Template.add('rating_style', "<style>@media screen and (max-width: 585px) {.kp_imdb_r{margin-top:-4.5em!important;margin-left:-15.3em!important;}}.kp_info__rate {padding: 0.3em;margin-left:1.2em;display: -webkit-box;display: -webkit-flex;display: -moz-box;display: -ms-flexbox;display: flex;background-color: rgba(23, 19, 18, 0.5);-webkit-border-radius: 0.3em;-moz-border-radius: 0.3em;border-radius: 0.3em;}.rating_size_l.kp{width: 3em} .rating_size_l.imdb,.rating_size_l.kp{display:block;position:relative;float:left;margin-left:4.5em;margin-top:-.16em;}.rating_size_l.kp:before{top:2px;left:-4.2em;content:'';width:2.3em;height:2.3em;position:absolute;background:url(data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjQgMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSI+PC9wYXRoPjxwYXRoIGQ9Ik0xMiAyMGg4djJoLThDNi40NzcgMjIgMiAxNy41MjMgMiAxMlM2LjQ3NyAyIDEyIDJzMTAgNC40NzcgMTAgMTBhOS45NTYgOS45NTYgMCAwIDEtMiA2aC0yLjcwOEE4IDggMCAxIDAgMTIgMjB6bTAtMTBhMiAyIDAgMSAxIDAtNCAyIDIgMCAwIDEgMCA0em0tNCA0YTIgMiAwIDEgMSAwLTQgMiAyIDAgMCAxIDAgNHptOCAwYTIgMiAwIDEgMSAwLTQgMiAyIDAgMCAxIDAgNHptLTQgNGEyIDIgMCAxIDEgMC00IDIgMiAwIDAgMSAwIDR6IiBmaWxsPSIjZmZmZmZmIiBjbGFzcz0iZmlsbC0wMDAwMDAiPjwvcGF0aD48L3N2Zz4=) no-repeat 0 0;background-size:100%}.rating_size_l.imdb:before{top:0;right:4em;content:'';width:2.7em;height:2.7em;position:absolute;background:url(data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjQgMjQiIHhtbDpzcGFjZT0icHJlc2VydmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTQgMTYuMDYzYS41LjUgMCAwIDEtLjUtLjVWOC41NDJhLjUuNSAwIDAgMSAxIDB2Ny4wMjFhLjUuNSAwIDAgMS0uNS41ek0xNyAxNi4wNjNhLjUuNSAwIDAgMS0uNS0uNVY4LjU0MmEuNS41IDAgMCAxIDEgMHY3LjAyMWEuNS41IDAgMCAxLS41LjV6TTguMDMxIDE2LjA2M2EuNS41IDAgMCAxLS40OC0uMzU3bC0xLjA1OS0zLjYzMy4wMDggMy40OWEuNS41IDAgMCAxLS40OTkuNUg2YS41LjUgMCAwIDEtLjUtLjQ5OGwtLjAxNi03LjAyMmEuNS41IDAgMCAxIC40MjktLjQ5Ni41MTIuNTEyIDAgMCAxIC41NTEuMzUzbDEuNTU4IDUuMzQ0IDEuNDk3LTUuMzM4YS41LjUgMCAwIDEgLjk4Mi4xMzZ2Ny4wMjFhLjUuNSAwIDAgMS0xIDB2LTMuMzg2bC0uOTg3IDMuNTIxYS40OTcuNDk3IDAgMCAxLS40NzkuMzY0bC0uMDA0LjAwMXoiIGZpbGw9IiNmZmZmZmYiIGNsYXNzPSJmaWxsLTAwMDAwMCI+PC9wYXRoPjxwYXRoIGQ9Ik0yMiAxOUgyYy0uODI3IDAtMS41LS42NzMtMS41LTEuNXYtMTFDLjUgNS42NzMgMS4xNzMgNSAyIDVoMjBjLjgyNyAwIDEuNS42NzMgMS41IDEuNXYxMWMwIC44MjctLjY3MyAxLjUtMS41IDEuNXpNMiA2YS41LjUgMCAwIDAtLjUuNXYxMWEuNS41IDAgMCAwIC41LjVoMjBjLjI3NSAwIC41LS4yMjUuNS0uNXYtMTFjMC0uMjc1LS4yMjUtLjUtLjUtLjVIMnoiIGZpbGw9IiNmZmZmZmYiIGNsYXNzPSJmaWxsLTAwMDAwMCI+PC9wYXRoPjxwYXRoIGQ9Ik0xOS4wNjMgMTZIMTdhLjUwMS41MDEgMCAwIDEtLjUtLjV2LTVjMC0uMjc1LjIyNS0uNS41LS41aDIuMDYzYTEuNDQgMS40NCAwIDAgMSAxLjQzOCAxLjQzOHYzLjEyNUExLjQ0IDEuNDQgMCAwIDEgMTkuMDYzIDE2ek0xNy41IDE1aDEuNTYzYS40MzcuNDM3IDAgMCAwIC40MzgtLjQzOHYtMy4xMjVhLjQzOS40MzkgMCAwIDAtLjQzOC0uNDM4SDE3LjVWMTV6TTE0LjA2MyAxNkgxMmEuNS41IDAgMCAxLS41LS41di03QS41LjUgMCAwIDEgMTIgOGgyLjA2M0ExLjQ0IDEuNDQgMCAwIDEgMTUuNSA5LjQzOHY1LjEyNUExLjQ0IDEuNDQgMCAwIDEgMTQuMDYzIDE2ek0xMi41IDE1aDEuNTYzYS40MzcuNDM3IDAgMCAwIC40MzgtLjQzOFY5LjQzOEEuNDM5LjQzOSAwIDAgMCAxNC4wNjMgOUgxMi41djZ6IiBmaWxsPSIjZmZmZmZmIiBjbGFzcz0iZmlsbC0wMDAwMDAiPjwvcGF0aD48L3N2Zz4=) no-repeat 0 0;background-size:100%}.rating_size_l .rating__value{font-weight:700;font-size:2.5em;margin-top:0px;margin-left:-.5em;color:#d8d8d8;cursor:pointer}.rating__progress{background:rgba(255,255,255,.52);border-radius:1px;margin-left:-4.4em;margin-top:.5em;height:4px;width:6.7em}.rating__progress:after{content:'';display:block;background:#fff;opacity:1;width:0%;height:100%;border-radius:1px;transition:width .2s ease-out}</style>");
		Lampa.Template.add('settings_modss', '<div><div class="settings-param-title"><span>Р”РѕРїРѕР»РЅРµРЅРёСЏ</span></div><div class="settings-param selector" data-type="toggle" data-name="online_modss"><div class="settings-param__name">Р’РєР»СЋС‡РёС‚СЊ РѕРЅР»Р°Р№РЅ</div><div class="settings-param__value"></div><div class="settings-param__descr">РџРѕР·РІРѕР»СЏРµС‚ РїСЂРѕСЃРјР°С‚СЂРёРІР°С‚СЊ С„РёР»СЊРјС‹, СЃРµСЂРёР°Р»С‹ РІ СЂРµР¶РёРјРµ Stream</div></div><div class="settings-param selector" data-type="toggle" data-name="forktv_modss"><div class="settings-param__name">Р’РєР»СЋС‡РёС‚СЊ ForkTV</div><div class="settings-param__value"></div><div class="settings-param__descr">РћС‚РѕР±СЂР°Р¶Р°РµС‚ РїСѓРЅРєС‚ В«ForkTVВ» РІ РіР»Р°РІРЅРѕРј РјРµРЅСЋ СЃ РїРѕРїСѓР»СЏСЂРЅС‹РјРё РёСЃС‚РѕС‡РЅРёРєР°РјРё, С‚РѕСЂСЂРµРЅС‚Р°РјРё</div></div><div class="settings-param selector" data-type="toggle" data-name="radio_modss"><div class="settings-param__name">Р’РєР»СЋС‡РёС‚СЊ СЂР°РґРёРѕ</div><div class="settings-param__value"></div><div class="settings-param__descr">РћС‚РѕР±СЂР°Р¶Р°РµС‚ РїСѓРЅРєС‚ В«Р Р°РґРёРѕВ» РІ РіР»Р°РІРЅРѕРј РјРµРЅСЋ СЃ РїРѕРїСѓР»СЏСЂРЅС‹РјРё СЂР°РґРёРѕ-СЃС‚Р°РЅС†РёСЏРјРё</div></div><div class="settings-param selector" data-type="toggle" data-name="collections_modss"><div class="settings-param__name">Р’РєР»СЋС‡РёС‚СЊ РїРѕРґР±РѕСЂРєРё</div><div class="settings-param__value"></div><div class="settings-param__descr">РћС‚РѕР±СЂР°Р¶Р°РµС‚ РїСѓРЅРєС‚ В«РџРѕРґР±РѕСЂРєРёВ» РІ РіР»Р°РІРЅРѕРј РјРµРЅСЋ СЃ РїРѕРїСѓР»СЏСЂРЅС‹РјРё РїРѕРґР±РѕСЂРєР°РјРё, С‚Р°РєРёРµ РєР°Рє Rezka, Filmix</div></div><div class="settings-param-title"><span>РЎС‚РёР»РёР·Р°С†РёСЏ</span></div><div class="settings-param selector" data-type="toggle" data-name="rating_modss"><div class="settings-param__name">Р’РєР»СЋС‡РёС‚СЊ СЂРµР№С‚РёРЅРі</div><div class="settings-param__value"></div><div class="settings-param__descr">РћС‚РѕР±СЂР°Р¶Р°РµС‚ СЂРµР№С‚РёРЅРі РљРёРЅРѕРїРѕРёСЃРє Рё IMDB</div></div><div class="settings-param selector" data-type="toggle" data-name="cardQuality_modss"><div class="settings-param__name">РљР°С‡РµСЃС‚РІРѕ РЅР° РєР°СЂС‚РѕС‡РєРµ</div><div class="settings-param__value"></div><div class="settings-param__descr">РћС‚РѕР±СЂР°Р¶Р°РµС‚ РЅР° РїРѕСЃС‚РµСЂРµ РєР°С‡РµСЃС‚РІРѕ РІРёРґРµРѕ, РєРѕС‚РѕСЂРѕРµ РґРѕСЃС‚СѓРїРЅРѕ РІ РѕРЅР»Р°Р№РЅРµ (WEBDL, BD, HDRip...)</div></div><div class="settings-param selector" data-type="toggle" data-name="serialInfo_modss"><div class="settings-param__name">РРЅС„РѕСЂРјР°С†РёСЏ Рѕ РєР°СЂС‚РѕС‡РєРµ</div><div class="settings-param__value"></div><div class="settings-param__descr">РћС‚РѕР±СЂР°Р¶Р°РµС‚ РёРЅС„РѕСЂРјР°С†РёСЋ Рѕ РєРѕР»РёС‡РµСЃС‚РІРµ СЃРµСЂРёР№ РІ РєР°СЂС‚РѕС‡РєРµ, РІ С‚РѕРј С‡РёСЃР»Рµ РїРѕСЃР»РµРґРЅРµСЋ СЃРµСЂРёСЋ РЅР° РїРѕСЃС‚РµСЂРµ</div></div><div class="settings-param selector hide" data-type="toggle" data-name="buttBack_modss"><div class="settings-param__name">Р’РєР»СЋС‡РёС‚СЊ РєРЅРѕРїРєСѓ "РќР°Р·Р°Рґ"</div><div class="settings-param__value"></div><div class="settings-param__descr">РћС‚РѕР±СЂР°Р¶Р°РµС‚ РІРЅРµС€РЅСЋСЋ РєРЅРѕРїРєСѓ "РќР°Р·Р°Рґ" РґР»СЏ СѓРґРѕР±РЅРѕР№ РЅР°РІРёРіР°С†РёРё РІ РїРѕР»РЅРѕСЌРєСЂР°РЅРѕРј СЂРµР¶РёРјРµ РЅР° СЂР°Р·Р»РёС‡РЅС‹С… СЃРјР°СЂС‚С„РѕРЅР°С…</div></div></div>');
		Lampa.Template.add('settings_filmix', "<div><div class=\"settings-param selector\" data-name=\"filmix_token\" data-type=\"input\" placeholder=\"РќР°РїСЂРёРјРµСЂ: nxjekeb57385b..\"><div class=\"settings-param__name\">Р”РѕР±Р°РІРёС‚СЊ РўРћРљР•Рќ РѕС‚ Filmix</div><div class=\"settings-param__value\"></div><div class=\"settings-param__descr\">Р”РѕР±Р°РІСЊС‚Рµ РўРћРљР•Рќ РґР»СЏ РїРѕРґРєР»СЋС‡РµРЅРёСЏ РїРѕРґРїРёСЃРєРё</div></div><div class=\"settings-param selector\" data-name=\"filmix_add\" data-static=\"true\"><div class=\"settings-param__name\">Р”РѕР±Р°РІРёС‚СЊ СѓСЃС‚СЂРѕР№СЃС‚РІРѕ РЅР° Filmix</div></div></div>");
		Lampa.Template.add('settings_forktv', "<div><div class=\"settings-param selector\" data-name=\"forktv_url\" data-type=\"input\"><div class=\"settings-param__name\">Р”РѕР±Р°РІРёС‚СЊ URL ForkTV</div><div class=\"settings-param__value\"></div><div class=\"settings-param__status\"></div><div class=\"settings-param__descr\">Р”РѕР±Р°РІСЊС‚Рµ URL Р°РґСЂРµСЃ</div></div><div class=\"settings-param hide selector\" data-name=\"ForkTV_add\" data-static=\"true\"><div class=\"settings-param__name\">"+(Lampa.Storage.get('ForkTv_cat', '') ? "РР·РјРµРЅРёС‚СЊ СЂР°Р·РґРµР»С‹" : "Р”РѕР±Р°РІРёС‚СЊ СЂР°Р·РґРµР»С‹")+"</div></div>   <div class=\"settings-param hide selector\" data-name=\"ForkTV_clear\" data-static=\"true\"><div class=\"settings-param__name\">РћС‡РёСЃС‚РёС‚СЊ СЂР°Р·РґРµР»С‹</div></div></div>");
		Lampa.Params.trigger('online_modss', true);
		Lampa.Params.trigger('radio_modss', true);
		Lampa.Params.trigger('forktv_modss', true);
		Lampa.Params.trigger('serialInfo_modss', true);
		Lampa.Params.trigger('cardQuality_modss', true);
		Lampa.Params.trigger('rating_modss', true);
		Lampa.Params.trigger('collections_modss', true);
		Lampa.Params.trigger('buttBack_modss', true);
		Lampa.Params.trigger('filmix', true);
		Lampa.Params.select('filmix_token', '', '');
		Lampa.Params.select('forktv_url', '', '');
		
		var network = new Lampa.Reguest();
		var api_url = 'http://filmixapp.cyou/api/v2/';
		var user_dev = '?user_dev_apk=1.1.3&user_dev_id=' + Lampa.Utils.uid(16) + '&user_dev_name=Xiaomi&user_dev_os=11&user_dev_vendor=Xiaomi&user_dev_token=';
		var cards;
		var ping_auth;
		Lampa.Listener.follow('full', function (e) {
			if (e.type == 'complite') {
			  cards = e.data.movie;
				if (Lampa.Storage.field('serialInfo_modss') && e.data.movie.source == 'tmdb' && e.data.movie.seasons && e.data.movie.last_episode_to_air) {
				  serialInfo(e.data.movie);
				}
				//Rating and QUALITY
				if (e.data.recomend && e.data.recomend.results.length > 0) {
					var elem = e.data.recomend.results.concat(e.data.movie);
					Lampa.VideoQuality.add(elem);
				}
				$('body').append(Lampa.Template.get('rating_style', {}, true));
				kinopoisk(e.data.movie);
				//Style buttons
				$('.view--torrent').addClass('selector').empty().append("<svg xmlns='http://www.w3.org/2000/svg'  viewBox='0 0 48 48' width='48px' height='48px'><path fill='#000' fill-rule='evenodd' d='M23.501,44.125c11.016,0,20-8.984,20-20 c0-11.015-8.984-20-20-20c-11.016,0-20,8.985-20,20C3.501,35.141,12.485,44.125,23.501,44.125z' clip-rule='evenodd'/><path fill='#fff' fill-rule='evenodd' d='M43.252,27.114C39.718,25.992,38.055,19.625,34,11l-7,1.077 c1.615,4.905,8.781,16.872,0.728,18.853C20.825,32.722,17.573,20.519,15,14l-8,2l10.178,27.081c1.991,0.67,4.112,1.044,6.323,1.044 c0.982,0,1.941-0.094,2.885-0.232l-4.443-8.376c6.868,1.552,12.308-0.869,12.962-6.203c1.727,2.29,4.089,3.183,6.734,3.172 C42.419,30.807,42.965,29.006,43.252,27.114z' clip-rule='evenodd'/></svg><span>РўРѕСЂСЂРµРЅС‚С‹</span>");
				$('.view--trailer').empty().append("<svg enable-background='new 0 0 512 512' id='Layer_1' version='1.1' viewBox='0 0 512 512' xml:space='preserve' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'><g><path fill='currentColor' d='M260.4,449c-57.1-1.8-111.4-3.2-165.7-5.3c-11.7-0.5-23.6-2.3-35-5c-21.4-5-36.2-17.9-43.8-39c-6.1-17-8.3-34.5-9.9-52.3   C2.5,305.6,2.5,263.8,4.2,222c1-23.6,1.6-47.4,7.9-70.3c3.8-13.7,8.4-27.1,19.5-37c11.7-10.5,25.4-16.8,41-17.5   c42.8-2.1,85.5-4.7,128.3-5.1c57.6-0.6,115.3,0.2,172.9,1.3c24.9,0.5,50,1.8,74.7,5c22.6,3,39.5,15.6,48.5,37.6   c6.9,16.9,9.5,34.6,11,52.6c3.9,45.1,4,90.2,1.8,135.3c-1.1,22.9-2.2,45.9-8.7,68.2c-7.4,25.6-23.1,42.5-49.3,48.3   c-10.2,2.2-20.8,3-31.2,3.4C366.2,445.7,311.9,447.4,260.4,449z M205.1,335.3c45.6-23.6,90.7-47,136.7-70.9   c-45.9-24-91-47.5-136.7-71.4C205.1,240.7,205.1,287.6,205.1,335.3z'/></g></svg><span>РўСЂРµР№Р»РµСЂС‹</span>");
				$('.open--menu').empty().append("<svg height='48' viewBox='0 0 48 48' width='48' xmlns='http://www.w3.org/2000/svg'><path d='M0 0h48v48H0z' fill='none'/><path fill='currentColor' d='M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4zm-4 29V15l12 9-12 9z'/></svg><span>РЎРјРѕС‚СЂРµС‚СЊ</span>");
				//Button online
		    add_online(e.data.movie);
			}
		});
		Lampa.Listener.follow('activity', function (e) {
			if (e.component == 'onlines_v1' && e.type == 'destroy') {
        if ($('body').find('.video--stream').length == 0)
          $('.card--new_ser,.card--viewed, .full-start__poster .time-line, .card--last_view').remove();
        last_view(e.object.movie);
			}
		});
		Lampa.Storage.listener.follow('change', function (e) {
			if (e.name == 'online_modss') add_online(cards);
			if (e.name == 'forktv_modss') add_forktv();
			if (e.name == 'radio_modss') add_radio();
			if (e.name == 'collections_modss') add_collections();
			if (e.name == 'serialInfo_modss') {
			 if (e.value == 'true' && $('body').find('.full-start__poster').length) serialInfo(cards);
			 else $('body').find('.full-start__poster .time-line, .card--last_view, .card--new_seria').remove();
			} 
			if (e.name == 'cardQuality_modss') {
			 if (e.value == 'true' && $('body').find('.full-start__poster').length) {
			   $('body').find('.kp_imdb_r').remove();
			   kinopoisk(cards);
			 }
			 else $('body').find('.full-start__poster >.card__quality').remove();
			} 
			if (e.name == 'rating_modss') {
			 if ($('body').find('.full-start__poster').length && e.value == 'true') kinopoisk(cards);
			 else $('body').find('.kp_imdb_r').remove();
			} 
			if (e.name == 'buttBack_modss') {
			 if (e.value == 'true') buttBack();
			 else $('body').find('.elem-mobile-back').remove();
			} 
			if (e.name == 'filmix_token') {
				if (e.value) checkPro(e.value);
				else {
					Lampa.Storage.set("filmix_status", {});
					showStatus();
				}
			}
			if (e.name == 'forktv_url') {
				if (e.value) check_forktv(e.value);
				else $('.settings-param__status').removeClass('active error wait').addClass('wait');
			}
		});
		Lampa.Settings.listener.follow('open', function (e) {
			if (e.name == 'forktv' && Lampa.Storage.get('forktv_url', '').length) check_forktv();
			if (e.name == 'modss') {
			  if(/iPhone|iPad|iPod|android|x11/i.test(navigator.userAgent)) $('[data-name="buttBack_modss"]').removeClass('hide');
			  $('.settings__title').text('MODS\'s');
			} else $('.settings__title').text('РќР°СЃС‚СЂРѕР№РєРё');
			if (e.name == 'filmix') {
				e.body.find('[data-name="filmix_add"]').unbind('hover:enter').on('hover:enter', function () {
					var user_code = '';
					var user_token = '';
					var modal = $('<div><div class="broadcast__text">Р’РІРµРґРёС‚Рµ РµРіРѕ РЅР° СЃС‚СЂР°РЅРёС†Рµ https://filmix.ac/consoles РІ РІР°С€РµРј Р°РІС‚РѕСЂРёР·РѕРІР°РЅРЅРѕРј Р°РєРєР°СѓРЅС‚Рµ!</div><div class="broadcast__device selector" style="text-align: center">РћР¶РёРґР°РµРј РєРѕРґ...</div><br><div class="broadcast__scan"><div></div></div></div></div>');
					Lampa.Modal.open({
						title: '',
						html: modal,
						onBack: function onBack() {
							Lampa.Modal.close();
							Lampa.Controller.toggle('settings_component');
							clearInterval(ping_auth);
						},
						onSelect: function onSelect() {
							Lampa.Utils.copyTextToClipboard(user_code, function () {
								Lampa.Noty.show('РљРѕРґ СЃРєРѕРїРёСЂРѕРІР°РЅ РІ Р±СѓС„РµСЂ РѕР±РјРµРЅР°');
							}, function () {
								Lampa.Noty.show('РћС€РёР±РєР° РїСЂРё РєРѕРїРёСЂРѕРІР°РЅРёРё');
							});
						}
					});
					ping_auth = setInterval(function () {
						checkPro(user_token, function () {
							Lampa.Modal.close();
							clearInterval(ping_auth);
							Lampa.Storage.set("filmix_token", user_token);
							e.body.find('[data-name="filmix_token"] .settings-param__value').text(user_token);
							Lampa.Controller.toggle('settings_component');
						});
					}, 10000);
					network.clear();
					network.timeout(10000);
					network.quiet(api_url + 'token_request' + user_dev, function (found) {
						if (found.status == 'ok') {
							user_token = found.code;
							user_code = found.user_code;
							modal.find('.selector').text(user_code);
						} else {
							Lampa.Noty.show(found);
						}
					}, function (a, c) {
						Lampa.Noty.show(network.errorDecode(a, c));
					});
				});
				showStatus();
			}
		});
		Lampa.Listener.follow('app', function (e) {
			if (e.type == 'ready' && Lampa.Settings.main) {
				var modss = $("<div class=\"settings-folder selector\" data-component=\"modss\"><div class=\"settings-folder__icon\">     <svg viewBox='0 0 24 24' xml:space='preserve' xmlns='http://www.w3.org/2000/svg'><path d='M19.7.5H4.3C2.2.5.5 2.2.5 4.3v15.4c0 2.1 1.7 3.8 3.8 3.8h15.4c2.1 0 3.8-1.7 3.8-3.8V4.3c0-2.1-1.7-3.8-3.8-3.8zm-2.1 16.4c.3 0 .5.2.5.5s-.2.5-.5.5h-3c-.3 0-.5-.2-.5-.5s.2-.5.5-.5h1V8.4l-3.2 5.4-.1.1-.1.1h-.6s-.1 0-.1-.1l-.1-.1-3-5.4v8.5h1c.3 0 .5.2.5.5s-.2.5-.5.5h-3c-.3 0-.5-.2-.5-.5s.2-.5.5-.5h1V7.1h-1c-.3 0-.5-.2-.5-.5s.2-.5.5-.5h1.7c.1 0 .2.1.2.2l3.7 6.2 3.7-6.2.2-.2h1.7c.3 0 .5.2.5.5s-.2.5-.5.5h-1v9.8h1z' fill='#ffffff' class='fill-000000'></path></svg>   </div><div class=\"settings-folder__name\">MODS's</div></div>");
				Lampa.Settings.main().render().find('[data-component="more"]').after(modss);
				Lampa.Settings.main().update();
			}
			if (e.type == 'ready') {
				add_filmix();
				add_forktv();
				buttBack(); 
			  add_radio();
			  add_collections();
			  cards = Lampa.Activity.active().card;  
				//FullScreen 
				if(/android|x11/i.test(navigator.userAgent)) {
  				var fullscreenBut = $('<div class="head__action fullscreenBut selector"><svg width="27" height="28" viewBox="0 0 27 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 11V2H11" stroke="currentColor" stroke-width="3"/><path d="M2 17V26H11" stroke="currentColor" stroke-width="3"/><path d="M25 11V2H16" stroke="currentColor" stroke-width="3"/><path d="M25 17V26H16" stroke="currentColor" stroke-width="3"/></svg></div>');
  		    $('.head__actions .open--notice').after(fullscreenBut); 
  				fullscreenBut.on('hover:enter click.hover', function () {
  					var doc = window.document;
  					var elem = doc.documentElement;
  					var requestFullScreen = elem.requestFullscreen || elem.mozRequestFullScreen || elem.webkitRequestFullScreen || elem.msRequestFullscreen;
  					var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
  					if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) requestFullScreen.call(elem);
  					else cancelFullScreen.call(doc);
  				});
				} 
			}
		});
    
    
    function buttBack() {
      if(/iPhone|iPad|iPod|android|x11/i.test(navigator.userAgent)) {
		    $('body').append('<style>.elem-mobile-back {position: fixed;z-index:99999;top: 50%;right: 0;width: 3em;height: 6em;background-image: url(../icons/player/prev.svg);background-repeat: no-repeat;background-position: 100% 50%;-webkit-background-size: contain;-moz-background-size: contain;-o-background-size: contain;background-size: contain;margin-top: -3em;font-size: .72em;display: block}</style><div class="elem-mobile-back"><svg width="131" height="262" viewBox="0 0 131 262" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M131 0C58.6507 0 0 58.6507 0 131C0 203.349 58.6507 262 131 262V0Z" fill="white"/><path d="M50.4953 125.318C50.9443 124.878 51.4313 124.506 51.9437 124.183L86.2229 90.4663C89.5671 87.1784 94.9926 87.1769 98.3384 90.4679C101.684 93.7573 101.684 99.0926 98.3384 102.385L68.8168 131.424L98.4907 160.614C101.836 163.904 101.836 169.237 98.4907 172.531C96.817 174.179 94.623 175 92.4338 175C90.2445 175 88.0489 174.179 86.3768 172.531L51.9437 138.658C51.4313 138.335 50.9411 137.964 50.4953 137.524C48.7852 135.842 47.9602 133.626 48.0015 131.421C47.9602 129.216 48.7852 127.002 50.4953 125.318Z" fill="black"/></svg></div>');
        $(".elem-mobile-back").on("click", function () {
          Lampa.Activity.back(); 
        });
      }
    }
    
    function add_radio() {
      var ico = '<svg width="24px" height="24px" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg" aria-labelledby="radioIconTitle" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" color="#000000"> <title id="radioIconTitle">Radio</title> <path d="M5.44972845 6C2.18342385 9.2663046 2.18342385 14.7336954 5.44972845 18M8.59918369 8C6.46693877 10.1322449 6.46693877 13.8677551 8.59918369 16M18.5502716 18C21.8165761 14.7336954 21.8165761 9.2663046 18.5502716 6M15.4008163 16C17.5330612 13.8677551 17.5330612 10.1322449 15.4008163 8"/> <circle cx="12" cy="12" r="1"/> </svg>';
			var menu_item = $('<li class="menu__item selector focus" data-action="Radio_n"><div class="menu__ico">' + ico + '</div><div class="menu__text">Р Р°РґРёРѕ</div></li>');
			menu_item.on('hover:enter', function () {
				var prox = Lampa.Storage.field('proxy_other') === false ? '' : 'https://cors.eu.org/';
				Lampa.Activity.push({
					url: prox + 'http://llpp.xyz/r/record/',
					title: 'Radio Record',
					component: 'Radio_n',
					page: 1
				});
			});
			if(Lampa.Storage.field('radio_modss'))
		    $('body').find('.menu .menu__list').eq(0).append(menu_item);
		  else $('body').find('[data-action="Radio_n"]').remove();
    } 
  	function Radio_n(object) {
  		var audio = new Audio();
  		var network = new Lampa.Reguest();
  		var scroll = new Lampa.Scroll({
  			mask: true,
  			over: true,
  			step: 250
  		});
  		var items = [];
  		var html = $('<div></div>');
  		var body = $('<div class="Radio_n category-full"></div>');
  		var prox = Lampa.Storage.field('proxy_other') === false ? '' : 'https://cors.eu.org/';
  		var info;
  		var last;
  		var song;
  		var playing = false;
  		this.create = function () {
  			var _this = this;
  			this.activity.loader(true);
  			network.silent(object.url, this.build.bind(this), function () {
  				var empty = new Lampa.Empty();
  				html.append(empty.render());
  				_this.start = empty.start;
  				_this.activity.loader(false);
  				_this.activity.toggle();
  			});
  			return this.render();
  		};
  		this.append = function (data) {
  			var _this3 = this;
  			var name = null;
  			var playlist = [];
  			data.forEach(function (element) {
  				var url_song = element.video;
  				var name_song = element.name;
  				if (name == null) name = name_song, song = url_song;
  				var card = Lampa.Template.get('card', {
  					title: name_song,
  					release_year: ''
  				});
  				playlist.push({
  					title: name_song,
  					url: url_song
  				});
  				card.addClass('card--category');
  				card.find('.card__img').css({
  					'cursor': 'pointer',
  					'background-color': '#353535a6'
  				}).attr('src', element.picture ? element.picture : './img/welcome.jpg');
  				card.on('hover:focus', function () {
  					last = card[0];
  					scroll.update(card, true);
  					info.find('.info__title').text(name_song);
  					info.find('.info__title-original').text(element.time + (element.quality ? ' / ' + element.quality : ''));
  				});
  				card.on('hover:enter hover:click', function () {
  					$(this).addClass('focus');
  					$('.title_plaing').text(name_song);
  					card.find('.card--category').addClass('focus');
  					if (url_song.indexOf('.m3u8') !== -1) {
  						var video = {
  							title: name_song,
  							url: url_song
  						};
  						Lampa.Player.play(video);
  						Lampa.Player.playlist(playlist);
  					} else _this3.Player(url_song);
  				});
  				body.append(card);
  				items.push(card);
  			});
  			if (info.find('.title_plaing').text() == '') info.find('.title_plaing').text(name);
  		};
  		this.build = function (data) {
  			var _this2 = this;
  			Lampa.Background.change(prox + 'http://llpp.xyz/r/back.jpg');
  			var but_style = '<style>.blink2{-webkit-animation:blink2 1.5s linear infinite;animation:blink2 1.5s linear infinite}@-webkit-keyframes blink2{100%{color:rgba(34,34,34,0)}}@keyframes blink2{100%{color:rgba(34,34,34,0)}}.controll,.controll *{box-sizing:content-box;letter-spacing:0}.controll{transition:.5s linear;border:3px solid #fff;background-color:#fff;border-radius:50%;margin-top:10px;margin-left:-39px;padding:15px;width:40%;height:3%;white-space:nowrap;text-align:center;cursor:pointer}.controll.pause{background-color:#353434;border-color:#3b6531}.controll,.controll .but_left,.controll .but_right,.controll:before{display:inline-block}.controll.pause .but_left,.controll.pause .but_right{margin-left:-6px;margin-top:-7px;border-left:7px solid #fff;border-top:0 solid transparent;border-bottom:0 solid transparent;height:18px}.controll.pause .but_left{border-right:10px solid transparent}.controll.play .but_right{margin-left:-3px;margin-top:-8px;border-left:15px solid #525252;border-top:10px solid transparent;border-bottom:10px solid transparent}.controll:hover,.controll.focus{background-color:#fff}.controll.play.focus{border-color:#8a8a8a}.controll.focus .but_left,.controll.focus .but_right,.controll:hover .but_left,.controll:hover .but_right{border-left-color:#252525}</style>';
  			but_style += '<style>.Radio_n .card--category .card__img {height: 45%!important;}.Radio_n .card__view {margin-bottom: -7em!important;}.stbut,.stbut *{box-sizing:content-box;letter-spacing:0}.title_plaing{position:absolute;text-align:center;width:150px;margin-top:-15px;font-size:0.8em}@media screen and (max-width: 585px) {.title_plaing{margin-top:-5px;font-size:1.3em}.stbut{font-size:2.3em!important;width:100px!important;padding:6px 2em 1px 0.7em!important;height:24.7px!important;}}.stbut{transition:.5s linear;border:3px solid #fbfbfb;background-color:#000;border-radius:46px;margin-top:10px;padding:4px 3em 2px 0.5em;font-size:1em;cursor:pointer;height:25.7px;width:130px}.stbut:hover, .stbut.focus{background-color:#edebef;color:#616060;border-color:#8e8e8e}</style>';
  			Lampa.Template.add('info_radio', '<div style="height:80px" class="radio_r info layer--width"><div class="info__left"><div style="margin-top:25px" class="info__title"></div><div class="info__create"></div></div><div class="info__right"> <b class="title_plaing"></b>   <div id="stantion_filtr"><div id="stbut" class="stbut selector"><b>РЎРўРђРќР¦РР</b></div></div>    <div id="player_radio"><div id="plbut" class="controll selector play"><span class="but_left"></span><span class="but_right"></span></div>' + but_style + '</div></div></div>');
  			info = Lampa.Template.get('info_radio');
  			info.find('#plbut').on('hover:enter hover:click', function () {
  				_this2.Player(audio.src ? audio.src : song);
  			});
  			info.find('#stbut').on('hover:enter hover:click', function () {
  				_this2.showStancia();
  			});
  			scroll.render().addClass('layer--wheight').data('mheight', info);
  			html.append(info.append());
  			html.append(scroll.render());
  			this.append(data);
  			scroll.append(body);
  			this.activity.loader(false);
  			this.activity.toggle();
  		};
  		this.showStancia = function () {
  			var catalogs = [{
  				title: 'Radio Record',
  				url: 'http://llpp.xyz/r/record/'
  			}, {
  				title: 'Р Р°РґРёРѕ РЈРєСЂР°РёРЅС‹',
  				url: 'http://llpp.xyz/ur/radio/ukraine/'
  			}, {
  				title: 'Р РѕРє',
  				url: 'http://llpp.xyz/r/rock/'
  			}, {
  				title: 'РўР°РЅС†РµРІР°Р»СЊРЅР°СЏ',
  				url: 'http://llpp.xyz/r/dance/'
  			}, {
  				title: 'Р СЌРї',
  				url: 'http://llpp.xyz/r/rap/'
  			}, {
  				title: 'Р¤РѕРЅРѕРІР°СЏ',
  				url: 'http://llpp.xyz/r/fon/'
  			}, {
  				title: 'Р”Р¶Р°Р·-Р‘Р»СЋР·',
  				url: 'http://llpp.xyz/r/jazz/'
  			}];
  			Lampa.Select.show({
  				title: 'РЎС‚РёР»СЊ',
  				items: catalogs,
  				onBack: function onBack() {
  					Lampa.Controller.toggle('content');
  				},
  				onSelect: function onSelect(a) {
  					Lampa.Activity.push({
  						url: prox + a.url,
  						title: a.title,
  						component: 'Radio_n',
  						page: 1
  					});
  				}
  			});
  		};
  		this.Player = function (file) {
  			if (audio.paused || (audio.src !== file || audio.src == null)) {
  				audio.src = file;
  				audio.play();
  				info.find('.title_plaing').removeClass('blink2');
  				info.find('#plbut').removeClass('play').addClass('pause');
  			} else {
  				audio.pause();
  				info.find('.title_plaing').addClass('blink2');
  				info.find('#plbut').removeClass('pause').addClass('play');
  			}
  		};
  		this.start = function () {
  			var _this = this;
  			Lampa.Controller.add('content', {
  				toggle: function toggle() {
  					Lampa.Controller.collectionSet(scroll.render(), info);
  					Lampa.Controller.collectionFocus(last || false, scroll.render());
  				},
  				left: function left() {
  					if (Navigator.canmove('left')) Navigator.move('left');
  					else Lampa.Controller.toggle('menu');
  				},
  				right: function right() {
  					if (Navigator.canmove('right')) Navigator.move('right');
  					else _this.showStancia();
  				},
  				up: function up() {
  					if (Navigator.canmove('up')) {
  						Navigator.move('up');
  					} else {
  						if (!info.find('#stbut').hasClass('focus') && !info.find('#plbut').hasClass('focus')) {
  							if (!info.find('#stbut').hasClass('focus')) {
  								Lampa.Controller.collectionSet(info);
  								Navigator.move('right');
  							}
  						} else Lampa.Controller.toggle('head');
  					}
  				},
  				down: function down() {
  					if (Navigator.canmove('down')) Navigator.move('down');
  					else Lampa.Controller.toggle('content');
  				},
  				back: function back() {
  					Lampa.Activity.backward();
  				}
  			});
  			Lampa.Controller.toggle('content');
  		};
  		this.pause = function () {
  			audio.pause();
  		};
  		this.stop = function () {};
  		this.render = function () {
  			return html;
  		};
  		this.destroy = function () {
  			audio.pause();
  			network.clear();
  			scroll.destroy();
  			info.remove();
  			html.remove();
  			body.remove();
  			audio = null;
  			network = null;
  			items = null;
  			html = null;
  			body = null;
  			info = null;
  		};
  	}
    
    function add_online(card){
       var btn = $("<div data-subtitle='Nikolai4 mods_v1.45' class='full-start__button selector focus view--onlines_v1'><svg height='1792' fill='currentColor' viewBox='0 0 1792 1792' width='1792' xmlns='http://www.w3.org/2000/svg'><path d='M896 128q209 0 385.5 103t279.5 279.5 103 385.5-103 385.5-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103zm384 823q32-18 32-55t-32-55l-544-320q-31-19-64-1-32 19-32 56v640q0 37 32 56 16 8 32 8 17 0 32-9z'/></svg><span>РћРЅР»Р°Р№РЅ</span></div>");
				btn.on('hover:enter click', function () {
					Lampa.Activity.push({
						url: '',
						title: 'РћРЅР»Р°Р№РЅ',
						component: 'onlines_v1',
						search: card.title,
						search_one: card.title,
						search_two: card.original_title,
						movie: card,
						page: 1
					});
				});
				add_filmix();
				if(Lampa.Storage.field('online_modss')) 
			    $('body').find('.view--torrent').after(btn);
			   else $('.view--onlines_v1').remove();
    }
    function serialInfo(card) {
      if(card.source == 'tmdb' && card.seasons && card.last_episode_to_air) {
      	var last_seria = card.last_episode_to_air.episode_number;
  			var last_seria_inseason = card.last_episode_to_air.season_number;
  			var air_new_episode = card.last_episode_to_air.episode_number;
  			var count_eps_last_seas;
  			var new_ser;
  			var seasons = card.seasons;
  			last_view(card);
  			seasons.forEach(function (eps) {
  				if (eps.season_number == last_seria_inseason) count_eps_last_seas = eps.episode_count;
  			});
  			if (card.next_episode_to_air) {
  				var add_ = '<b>' + last_seria;
  				var notices = Lampa.Storage.get('account_notice', []).filter(function (n) {
  					return n.card_id == card.id;
  				});
  				if (notices.length) {
  					var notice = notices[0];
  					var episod_new = JSON.parse(notice.data).card.seasons;
  					if (Lampa.Utils.parseTime(notice.date).full == Lampa.Utils.parseTime(Date.now()).full) {
  						add_ = 'РќРѕРІР°СЏ <b>' + episod_new[last_seria_inseason];
  					}
  				}
  				new_ser = add_ + '</b> СЃРµСЂРёСЏ РёР· ' + count_eps_last_seas + ' - S' + last_seria_inseason;
  			} else new_ser = 'РџРѕСЃР»РµРґРЅСЏСЏ <b>' + last_seria + '</b> СЃРµСЂРёСЏ - S' + last_seria_inseason;
  			$('body').find('.full-start__poster').append("<div class='card--new_seria' style='right: -0.6em;position: absolute;background: #168FDF;color: #fff;bottom: 1em;padding: 0.4em 0.4em;font-size: 1.2em;-webkit-border-radius: 0.3em;-moz-border-radius: 0.3em;border-radius: 0.3em;'>" + new_ser + "</div>");
      }
    }
  	function kinopoisk(card) {
  	  var params = {
  			movie: card.title,
  			id: card.id,
  			url: "http://corsanywhere.herokuapp.com/https://kinopoiskapiunofficial.tech/",
  			headers: {
  				'X-API-KEY': '2a4a0808-81a3-40ae-b0d3-e11335ede616'
  			},
  			order: ["kinopoisk", "imdb"],
  			imdb_template: '<div class="imdb rating_size_l">' + '<div class="rating__value" id="imdb-rating">$rating</div>' + '<div class="imdb rating__progress block"><style>.imdb .rating__progress:after {width:$progress%} </style></div>' + '</div>',
  			kp_template: '<div class="kp rating_size_l">' + '<div class="rating__value" id="kp-rating">$rating</div>' + '<div class="kp rating__progress block"><style>.kp .rating__progress:after {width:$progress%} </style></div>' + '</div>',
  			cache_time: 60 * 60 * 24 * 1000 //86400000 СЃРµРє = 1РґРµРЅСЊ Р’СЂРµРјСЏ РєСЌС€Р° РІ СЃРµРєСѓРЅРґР°С…
  		};
  		 if (Lampa.Storage.field('rating_modss')) {
  		    if (Lampa.Storage.field('rating_modss')) $('body').find('.full-start__icons .icon--wath').after('<div class="kp_imdb_r"><img width="45px" src="./img/loader.svg" /></div>');
  		    getRating();
  		 } 
  		 if (Lampa.Storage.field('cardQuality_modss')) Quality_video();
  
  		function getRating() {
  			var network = new Lampa.Reguest();
  			var movieRating = _getCache(params.id);
  			if (movieRating) {
  				return _showRating(movieRating[params.id]);
  			} else {
  				network.silent(params.url + 'api/v2.1/films/search-by-keyword?keyword=' + encodeURIComponent(params.movie), function (json) {
  					if (json.films.length) {
  						var id = json.films[0].filmId;
  						network.silent(params.url + 'api/v2.2/films/' + id, function (data) {
  							var data = {
  								kp: data.ratingKinopoisk,
  								imdb: data.ratingImdb,
  								timestamp: new Date().getTime()
  							};
  							movieRating = _setCache(params.id, data); // РљРµС€РёСЂСѓРµРј РґР°РЅРЅС‹Рµ
  							return _showRating(movieRating, params.id);
  						}, function (a, c) {
  							Lampa.Noty.show(network.errorDecode(a, c));
  						}, false, {
  							headers: params.headers
  						});
  					} else {
  						var data = {
  							kp: 0,
  							imdb: 0,
  							timestamp: new Date().getTime()
  						};
  						movieRating = _setCache(params.id, data); // РљРµС€РёСЂСѓРµРј РґР°РЅРЅС‹Рµ
  						return _showRating(movieRating);
  					}
  				}, function (a, c) {
  					Lampa.Noty.show('Р РµР№С‚РёРЅРі KP   ' + network.errorDecode(a, c));
  				}, false, {
  					headers: params.headers
  				});
  			}
  		}
  
  		function _getCache(movie) {
  			var timestamp = new Date().getTime();
  			var cache = Lampa.Storage.cache('kp_rating', 500, {}); //500 СЌС‚Рѕ Р»РёРјРёС‚ РєР»СЋС‡РµР№
  			if (cache[movie]) {
  				if ((timestamp - cache[movie].timestamp) > params.cache_time) {
  					// Р•СЃР»Рё РєРµС€ РёСЃС‚С‘Рє, С‡РёСЃС‚РёРј РµРіРѕ
  					delete cache[movie];
  					Lampa.Storage.set('kp_rating', cache);
  					return false;
  				}
  			} else return false;
  			return cache;
  		}
  
  		function _setCache(movie, data) {
  			var timestamp = new Date().getTime();
  			var cache = Lampa.Storage.cache('kp_rating', 500, {}); //500 СЌС‚Рѕ Р»РёРјРёС‚ РєР»СЋС‡РµР№
  			if (!cache[movie]) {
  				cache[movie] = data;
  				Lampa.Storage.set('kp_rating', cache);
  			} else {
  				if ((timestamp - cache[movie].timestamp) > params.cache_time) {
  					data.timestamp = timestamp;
  					cache[movie] = data;
  					Lampa.Storage.set('kp_rating', cache);
  				} else data = cache[movie];
  			}
  			return data;
  		}
  
  		function _showRating(data, movie) {
  			if (data) {
  				var kp_rating = !isNaN(data.kp) && data.kp !== null ? parseFloat(data.kp).toFixed(1) : '0.0';
  				var imdb_rating = !isNaN(data.imdb) && data.imdb !== null ? parseFloat(data.imdb).toFixed(1) : '0.0';
  				var kp_tpl = _getTemplate(params.kp_template, kp_rating);
  				var imdb_tpl = _getTemplate(params.imdb_template, imdb_rating);
  				var ratings = {
  					kinopoisk: kp_tpl,
  					imdb: imdb_tpl
  				};
  				var text = "";
  				for (var i in params.order) {
  					if (params.order.hasOwnProperty(i)) {
  						if (typeof ratings[params.order[i]] != 'undefined') {
  							text += ratings[params.order[i]];
  						}
  					}
  				}
  				return $('.kp_imdb_r').html('<div class="kp_info__rate">' + text + '</div').show();
  			}
  		}
  
  		function _getTemplate(template, $rating) {
  			return template.replace("$rating", $rating).replace("$progress", $rating * 10);
  		}
  
  		function Quality_video() {
  			var itm = card;
  			var data = Lampa.Storage.cache('quality_', 500, []);
  			var cache = Lampa.VideoQuality.get(itm);
  			if (data) {
  				var fid = data.filter(function (e) {
  					return e.id == itm.id;
  				});
  				var quality = (fid[fid.length - 1] && !cache) ? fid[fid.length - 1].quality : cache;
  				var cache_time = fid[fid.length - 1] ? (fid[fid.length - 1].scaned_time || 0) : false;
  				var re_search = quality ? cache_time ? cache_time + 60 * 60 * 12 * 1000 < Date.now() : false : false;
  				if ((fid.length == 0 && !cache) || re_search) {
  					var network = new Lampa.Reguest();
  					var url = 'http://cdn.svetacdn.in/api/';
  					var token = '3i40G5TSECmLF77oAqnEgbx61ZWaOYaE';
  					var type = Lampa.Activity.active().method;
  					if (Lampa.Activity.active().card.original_language == 'ja') {
  						type = 'anime-tv-series';
  					} else type = (type == 'movie') ? 'movies' : 'tv-series';
  					url += type;
  					url = Lampa.Utils.addUrlComponent(url, 'api_token=' + token);
  					url = Lampa.Utils.addUrlComponent(url, itm.imdb_id ? 'imdb_id=' + encodeURIComponent(itm.imdb_id) : 'title=' + encodeURIComponent(itm.name));
  					url = Lampa.Utils.addUrlComponent(url, 'field=' + encodeURIComponent('global'));
  					network.silent(url, function (found) {
  						var qualitys = ['ts', 'camrip', 'webdl', 'dvdrip', 'hdrip', 'bd'];
  						var index = 0;
  						var quality;
  						if (found.data.length) {
  							var founds = found.data[0].media ? found.data[0].media : found.data[0].episodes.length > 1 ? found.data[0].episodes[0].media : found.data[0].episodes;
  							founds.map(function (m) {
  								index = Math.max(index, qualitys.indexOf(m.source_quality));
  								quality = qualitys[index];
  							});
  							data.push({
  								id: itm.id,
  								title: itm.title,
  								scaned_time: Date.now(),
  								quality: quality
  							});
  							Lampa.Storage.set('quality_', data);
  							Lampa.Storage.set('quality_scan', data);
  							$('body').find('.full-start__poster').append('<div style="bottom:70%" class="card__quality">' + quality + '</div>');
  						}
  					}, function (a, c) {
  						console.error('Quality_video_' + itm.title, network.errorDecode(a, c));
  					});
  				} else $('body').find('.full-start__poster').append('<div style="bottom:70%" class="card__quality"><div>' + quality + '</div></div>');
  			}
  		}
  	}
    
    function add_forktv(){
  		var field = $('<div class=\"settings-folder forktv selector\" data-component=\"forktv\"><div class=\"settings-folder__icon\"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round" stroke="#ffffff" stroke-width="2" class="stroke-000000"><path d="M4.4 2h15.2A2.4 2.4 0 0 1 22 4.4v15.2a2.4 2.4 0 0 1-2.4 2.4H4.4A2.4 2.4 0 0 1 2 19.6V4.4A2.4 2.4 0 0 1 4.4 2Z"></path><path d="M12 20.902V9.502c-.026-2.733 1.507-3.867 4.6-3.4M9 13.5h6"></path></g></svg></div><div class=\"settings-folder__name\">ForkTV</div></div>');
    	if (Lampa.Storage.field('forktv_modss') && Lampa.Settings.main && !Lampa.Settings.main().render().find('[data-component="forktv"]').length)
  		Lampa.Settings.main().render().find('[data-component="modss"]').after(field);
			else Lampa.Settings.main().render().find('[data-component="forktv"]').remove();
  	  Lampa.Settings.main().update();
  	  var ico = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round" stroke="#ffffff" stroke-width="2" class="stroke-000000"><path d="M4.4 2h15.2A2.4 2.4 0 0 1 22 4.4v15.2a2.4 2.4 0 0 1-2.4 2.4H4.4A2.4 2.4 0 0 1 2 19.6V4.4A2.4 2.4 0 0 1 4.4 2Z"></path><path d="M12 20.902V9.502c-.026-2.733 1.507-3.867 4.6-3.4M9 13.5h6"></path></g></svg>';
			var menu_item = $('<li class="menu__item selector focus" data-action="forktv"><div class="menu__ico">' + ico + '</div><div class="menu__text">ForkTV</div></li>');
			menu_item.on('hover:enter', parse);
			if (Lampa.Storage.field('forktv_modss')) $('.menu .menu__list').eq(0).append(menu_item);
			else $('body').find('[data-action="forktv"]').remove();
    }
    function parse() {
  		var network = new Lampa.Reguest();
      network.clear(); 
      network.timeout(10000);
      network.silent('https://get.geojs.io/v1/ip/geo.js', function (found) {
       	var forktv_url = Lampa.Storage.get('forktv_url', '');
    		if (forktv_url.lastIndexOf('/') > 6) forktv_url = forktv_url.slice(0, forktv_url.lastIndexOf('/'));
    		var forktv_id = Lampa.Storage.cache('forktv_id', 1, []);
    		var id_mac = Lampa.Utils.uid(16);
    		if (forktv_id.length == 0) {
    			forktv_id.push(id_mac);
    			Lampa.Storage.set('forktv_id', forktv_id);
    		}
    		var user_dev = '/?box_client=lg&box_mac=' + forktv_id + '&initial=ForkXMLviewer|' + forktv_id + '|YAL-L41%20sdk%2029|87b13d368f81872b|MTY1MjI4NTM0NAR=E1341|7AD953401F39875|androidapi|0|Android-device_YAL-L41_sdk_29&vr=0&platform=android-device&country='+found.country_code+'&tvp=0&hw=1.6&cors=android-device';
    		if (!forktv_url) Lampa.Controller.toggle('settings');
    		else {
    			network.clear();
    			network.timeout(8000);
    			network.silent(forktv_url + user_dev, function (json) {
    				json = json.channels;
    				if (json.length === 1) {
    					Lampa.Modal.open({
    						title: json[0].title,
    						html: $(json[0].description),
    						onBack: function onBack() {
    							Lampa.Modal.close();
    							Lampa.Controller.toggle('forktv');
    						}
    					});
    				} else {
    					if (Lampa.Storage.get('ForkTv_cat', '') !== '') {
    						var get_cach = Lampa.Storage.get('ForkTv_cat', '');
    						var itms = [];
    						get_cach.cat.forEach(function (it) {
    							if (it.checked) itms.push({
    								title: it.title,
    								playlist_url: it.url, 
    								logo_30x30: it.img, 
    								home: true
    							});
    						});
    						if (itms.length > 0) {
    						  Lampa.Activity.push({
      							title: 'ForkTV',
      							url: {channels:itms},
      							submenu: true,
      							component: 'forktv',
      							page: 1
      						});
    						} else categoryes(json);
    					} else categoryes(json);
    				}
    			}, function (a, c) {
    				Lampa.Noty.show(network.errorDecode(a, c));
    			});
    		}
      }, function (a, c) {
        Lampa.Noty.show(network.errorDecode(a, c));
      }, false, {
        dataType: 'jsonp',
        jsonpCallback: 'geoip'
      });
      
  	}
  	function categoryes(json) {
  		var item = [];
  		var get_cach = Lampa.Storage.get('ForkTv_cat', '');
  		if (!get_cach) {
  			json.forEach(function (itm, i) {
  				if (itm.title !== 'РќРѕРІРѕСЃС‚Рё') {
  					item.push({
  						title: itm.title,
  						url: itm.playlist_url,
  						img: itm.logo_30x30, 
  						checkbox: true
  					});
  				}
  			});
  		} else item = get_cach.cat;
  
  		function select(where, a) {
  			where.forEach(function (element) {
  				element.selected = false;
  			});
  			a.selected = true;
  		}
  
  		function main() {
  			Lampa.Controller.toggle('settings_component');
  			var cache = Lampa.Storage.cache('ForkTv_cat', 1, {});
  			var catg = [];
  			item.forEach(function (a) {
  				catg.push(a);
  			});
  			if (catg.length > 0) {
  				cache = {cat:catg};
  				Lampa.Storage.set('ForkTv_cat', cache);
  			}
  		}
  		Lampa.Select.show({
  			items: item,
  			title: get_cach ? 'РР·РјРµРЅРёС‚СЊ СЂР°Р·РґРµР»С‹' : 'Р”РѕР±Р°РІРёС‚СЊ СЂР°Р·РґРµР»С‹',
  			onBack: main,
  			onSelect: function onSelect(a) {
  				select(item, a);
  				main();
  			}
  		});
  	}
		function check_forktv (url) {
      network.clear(); 
      network.timeout(10000);
      network.silent('https://get.geojs.io/v1/ip/geo.js', function (found) {
        check(url, found.country_code);
      }, function (a, c) {
        Lampa.Noty.show(network.errorDecode(a, c));
      }, false, {
        dataType: 'jsonp',
        jsonpCallback: 'geoip'
      });
    };
		function check(url, country_code) {
			var forktv_url = Lampa.Storage.get('forktv_url', '');
			var forktv_id = Lampa.Storage.cache('forktv_id', 1, []);
			var id_mac = Lampa.Utils.uid(16);
			if (forktv_id.length == 0) {
				forktv_id.push(id_mac);
				Lampa.Storage.set('forktv_id', forktv_id);
			}
			var user_dev = '?box_client=lg&box_mac=' + forktv_id + '&initial=ForkXMLviewer|' + forktv_id + '|YAL-L41%20sdk%2029|87b13d368f81872b|MTY1MjI4NTM0NAR=E1341|7AD953401F39875|androidapi|0|Android-device_YAL-L41_sdk_29&vr=0&platform=android-device&country='+country_code+'&tvp=0&hw=1.6&cors=android-device';
			url = url ? url : forktv_url;
			if (url.lastIndexOf('/') > 6) url = url.slice(0, url.lastIndexOf('/'));
			var status = $('.settings-param__status').removeClass('active error wait').addClass('wait');
			network.timeout(5000);
			network.silent(url + user_dev, function (json) {
				if (json.channels.length === 1) {
					Lampa.Modal.open({
						title: json.channels[0].title,
						html: $(json.channels[0].description),
						onBack: function onBack() {
							Lampa.Modal.close();
							Lampa.Controller.toggle('settings_component');
						}
					});
				} else {
					status.removeClass('wait').addClass('active');
					$('body').find('[data-name="ForkTV_add"]').removeClass('hide').unbind('hover:enter').on('hover:enter', function () {
						categoryes(json.channels);
					});
					$('body').find('[data-name="ForkTV_clear"]').removeClass('hide').unbind('hover:enter').on('hover:enter', function () {
						Lampa.Storage.set('ForkTv_cat', '');
						Lampa.Noty.show('Р Р°Р·РґРµР»С‹ СѓСЃРїРµС€РЅРѕ РѕС‡РёС‰РµРЅС‹');
					});
				}
			}, function (e) {
			  $('body').find('[data-name="ForkTV_clear"], [data-name="ForkTV_add"]').addClass('hide');
				status.removeClass('wait').addClass('error');
			}, false, {
				dataType: 'json'
			});
		}
		
    function add_filmix(){
      var field = $("<div class=\"settings-folder selector\" data-component=\"filmix\"><div class=\"settings-folder__icon\"><svg height=\"44\" viewBox=\"0 0 27 44\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M0 10.1385V44H9.70312V29.0485H23.7656V19.2233H9.70312V15.6634C9.70312 11.8188 12.6562 9.39806 15.8906 9.39806H27V0H9.70312C5.20312 0 0 3.41748 0 10.1385Z\" fill=\"white\"/></svg></div><div class=\"settings-folder__name\">Filmix</div></div>");
			if(Lampa.Storage.field('online_modss') && Lampa.Settings.main && !Lampa.Settings.main().render().find('[data-component="filmix"]').length) 
			Lampa.Settings.main().render().find('[data-component="modss"]').after(field);
			else Lampa.Settings.main().render().find('[data-component="filmix"]').remove();
			Lampa.Settings.main().update();
    }
		function showStatus() {
			var status = Lampa.Storage.get("filmix_status", '{}');
			var info = 'РЈСЃС‚СЂРѕР№СЃС‚РІРѕ РЅРµ Р°РІС‚РѕСЂРёР·РѕРІР°РЅРЅРѕ';
			if (status.login) {
				if (status.is_pro) info = status.login + ' - PRO РґРѕ - ' + status.pro_date;
				else if (status.is_pro_plus) info = status.login + ' - PRO_PLUS РґРѕ - ' + status.pro_date;
				else info = status.login + ' - NO PRO';
			}
			var field = $("<div class=\"settings-param\" data-name=\"filmix_status\" data-static=\"true\"><div class=\"settings-param__name\">РЎС‚Р°С‚СѓСЃ</div><div class=\"settings-param__value\">".concat(info, "</div></div>"));
			$('.settings [data-name="filmix_status"]').remove();
			$('.settings [data-name="filmix_add"]').after(field);
		}
		function checkPro(token, call) {
			network.clear();
			network.timeout(8000);
			network.silent(api_url + 'user_profile' + user_dev + token, function (json) {
				if (json) {
					if (json.user_data) {
						Lampa.Storage.set("filmix_status", json.user_data);
						if (call) call();
					} else {
						Lampa.Storage.set("filmix_status", {});
					}
					showStatus();
				}
			}, function (a, c) {
				Lampa.Noty.show(network.errorDecode(a, c));
			});
		}
		
		function add_collections(){
		  if(Lampa.Storage.field('collections_modss')) $('body').find('[data-action="collections"]').attr('data-action', 'collection').unbind('hover:enter').on('hover:enter', function (e) {
				Lampa.Select.show({
					title: 'РџРѕРґР±РѕСЂРєРё',
					items: [{
						title: 'РџРѕРґР±РѕСЂРєРё РЅР° ivi',
						source: 'ivi'
					}, {
						title: 'РџРѕРґР±РѕСЂРєРё РЅР° okko',
						source: 'okko'
					}, {
						title: 'РџРѕРґР±РѕСЂРєРё РЅР° filmix',
						url: 'https://filmix.ac/playlists/rateup',
						source: 'filmix'
					}, {
						title: 'РџРѕРґР±РѕСЂРєРё РЅР° rezka',
						url: 'http://kinopub.me/collections',
						source: 'rezka'
					}],
					onSelect: function onSelect(a) {
						if (a.source == 'ivi' || a.source == 'okko') {
							Lampa.Activity.push({
								url: '',
								source: a.source,
								title: a.title,
								component: 'collections',
								page: 1
							});
						} else gets(a);
					},
					onBack: function onBack() {
						Lampa.Controller.toggle('content');
					}
				});
			});
			else $('body').find('[data-action="collection"]').attr('data-action', 'collections');
		} 
		function gets(a) {
  		var network = new Lampa.Reguest();
  		var cors = 'http://corsanywhere.herokuapp.com/';
  		network.clear();
  		network.timeout(1000 * 20);
  		network["native"](cors + a.url, function (str) {
  			if (str) {
  				var card = [];
  				var page;
  				if (a.source == 'rezka') {
  					page = $('.b-navigation', str).find('a:last-child').attr('href');
  					var h = $('.b-content__collections_item', str);
  					$(h).each(function (i, html) {
  						card.push({
  							title: $('.title-layer', html).text(),
  							url: $('a', html).attr('href'),
  							img: $('img', html).attr('src'),
  							quantity: $('.num', html).text() + ' РІРёРґРµРѕ'
  						});
  					});
  				} else if (a.source == 'filmix') {
  					var html = $('.playlist-articles', str).html() || $('.m-list-movie', str).html();
  					$(html).each(function (i, html) {
  						if (html.tagName == 'DIV') page = $(html).find('.next').attr('href');
  						if (html.tagName == 'ARTICLE') card.push({
  							title: $('.m-movie-title', html).text() || $('.poster', html).attr('alt'),
  							url: $('a', html).attr('href'),
  							img: $('img', html).attr('src'),
  							quantity: $('.m-movie-quantity', html).text() || $('.count', html).text()
  						});
  					});
  				}
  				Lampa.Activity.push({
  					data: {
  						card: card,
  						page: page
  					},
  					url: a.url,
  					source: a.source,
  					title: a.title,
  					card_cat: true,
  					component: 'collection',
  					page: 1
  				});
  			}
  		}, function (a, c) {
  			Lampa.Noty.show(network.errorDecode(a, c));
  		}, false, {
  			dataType: 'text',
  			headers: {
  				"accept": "*/*",
  				"accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
  				"user-agent": "WebOS; Linux/SmartTV:Mozilla/5.0 (WebOS; Linux/SmartTV; x64; rv:99.0) Gecko/20100101 Firefox/99.0",
  				"x-requested-with": "XMLHttpRequest"
  			}
  		});
  	}
  	
  	/*
  	document.addEventListener("keydown", function(inEvent){
      if (inEvent.keyCode === 428 || inEvent.keyCode === 34) {
		    $(this).find('.player-panel__prev.button.selector').click();
			} else if (inEvent.keyCode === 427 || inEvent.keyCode === 33) {
  			$(this).find('.player-panel__next.button.selector').click();
			}			
	  });
	  
	  Lampa.Keypad.listener.follow('keydown', function (e) {
      var code = e.code;
      console.log ('code', code);
      if (Lampa.Player.opened()) {
        if (code === 428 || code === 34) {
          Lampa.Controller.trigger('prev');
  			  console.log ("[P- button hit]");
        } 
        if (code === 427 || code === 33) {
  			  Lampa.Controller.trigger('next');
    			console.log ("[P+ button hit]");
        } 
      } 
    });
    */
     

	}
	if (!window.plugin) startPlugin();
})();