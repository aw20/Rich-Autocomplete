/*
 * Rich Autocomplete Plugin
 * http://www.aw20.net/
 *
 * Copyright 2011, aw2.0 Ltd.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 * 
 *  $Id: aw20.richac.js 2244 2011-05-13 16:20:26Z jamie $
 */

(function($){
	
	//methods available for calling by the user
	var publicMethods = {
		//initialisation
		init: function(options) {
			return this.each(function(){
				var $acObj = $(this);
				
				if (!$acObj.data('richac')) {
					var settings = $.extend({}, $.fn.richac.defaults, options);
					
					//assign a datasource for searches
					var thisSource;
					if (settings.url) {
						thisSource = settings.url;
					} else if (settings.data) {
						thisSource = settings.data;
					} else {
						privateMethods.showError('no datasource defined, please provide a data or url parameter.');
					}
					
					//set this element as initialised
					$acObj.data('richac', {
						settings: settings,
						target: $acObj,
						datasource: thisSource,
						usage: false,
						lastSearch: "",
						searchTrack: null,
						blockClose: false
					});
					
					//track when entering field to start autocomplete
					$acObj.bind('focusin', function(event) {
						//if charaters in field are more than min required
						if($acObj.val().length >= $acObj.data('richac').settings.minCharacters) {
							//if plugin ui has not been started
							if(!$acObj.data('richac').usage) {
								//start ui
								privateMethods.startCompletionUi($acObj);
								//set in use
								$acObj.data('richac').usage = true;
								//run a search on what is in this field
								privateMethods.doSearch($acObj);
							}
						}
					});
					
					//track when leaving field to kill autocomplete
					$acObj.bind('focusout', function(event) {
						//if closing is not blocked (if we DONT lose focus by selecting an element with the mouse)
						if(!$acObj.data('richac').blockClose) {
							//stop ui as field is not active
							privateMethods.stopCompletionUi($acObj, true);
						}
					});
					
					//track key up events on the object
					$acObj.bind('keyup', function(event) {
						//perform key processing
						switch(event.which) {
						case 13://return
							//stop ui and make selection
							privateMethods.stopCompletionUi($acObj);
							break;
						case 27://esc
							//stop ui and make selection
							privateMethods.stopCompletionUi($acObj, true);
							break;
						case 38://up
							//if plugin is in use
							if($acObj.data('richac').usage) {
								//if a selection exists
								if($acObj.data('richac').currentSelection != undefined) {
									//get current selection
									var currentSelectId = parseInt($acObj.data('richac').currentSelection.attr("idSelect"));
									//check there is one available before it
									if ( ((currentSelectId - 1) >= 0) ) {
										//set the previous selection as current
										$acObj.data('richac').currentSelection = $("#acui_item[idSelect='" + (parseInt($acObj.data('richac').currentSelection.attr("idSelect")) - 1) + "']");
									} else {
										//non available before this one so set undefined so the user doesnt have to select one
										$acObj.data('richac').currentSelection = undefined;
									}
								} else {
									//no selection is active so start at the last one
									$acObj.data('richac').currentSelection = $("#acui_item:last", "#acui");
								}
								//update selection ui
								privateMethods.setSelection($acObj);
							}
							break;
						case 40://down
							//if plugin is in use
							if($acObj.data('richac').usage) {
								//if a selection exists
								if($acObj.data('richac').currentSelection != undefined) {
									//get current selection
									var currentSelectId = parseInt($acObj.data('richac').currentSelection.attr("idSelect"));
									//check there is one available after it
									if ( ((currentSelectId + 1) <= parseInt($("#acui_item:last", "#acui").attr("idSelect"))) ) {
										//set the next selection as current
										$acObj.data('richac').currentSelection = $("#acui_item[idSelect='" + (parseInt($acObj.data('richac').currentSelection.attr("idSelect")) + 1) + "']");
									} else {
										//non available after this one so set undefined so the used doesnt have to select one
										$acObj.data('richac').currentSelection = undefined;
									}
								} else {
									//no selection is active so start at the first one
									$acObj.data('richac').currentSelection = $("#acui_item:first", "#acui");
								}
								//update selection ui
								privateMethods.setSelection($acObj);
							}
							break;
						default:
							//upon any key press check if field characters is greater than the minimum required
							if($acObj.val().length >= $acObj.data('richac').settings.minCharacters) {
								//if plugin is not started
								if(!$acObj.data('richac').usage) {
									//start the ui
									privateMethods.startCompletionUi($acObj);
									//set usage to true
									$acObj.data('richac').usage = true;
								}
								if($acObj.data('richac').settings.minDelay > 0) {
									//clear any previous timeouts
									window.clearTimeout($acObj.data('richac').searchTrack);
									//set a timeout after the user specified delay period to run a search
									$acObj.data('richac').searchTrack = window.setTimeout(function() {privateMethods.doSearch($acObj);}, $acObj.data('richac').settings.minDelay);
								} else {
									privateMethods.doSearch($acObj);
								}
							} else {
								//else the field characters are not enough to run a search yet so stop any active ui and dont select anything
								privateMethods.stopCompletionUi($acObj, true);
							}
							break;
						}
					});
					
					//events for mouse over a selection item
					$("#acui_item").live("mouseover", function() {
						//set selection using mouse
						$acObj.data('richac').currentSelection = $(this);
						//block the closing of the plugin by losing focus because it will be a selection of our items if clicked now
						$acObj.data('richac').blockClose = true;
						//update sleection ui
						privateMethods.setSelection($acObj);
					});
					
					//events for mouse out of a selection item
					$("#acui_item").live("mouseout", function() {
						//cancel close blocking so clicking now can lose focus of the field and close the plugin properly
						$acObj.data('richac').blockClose = false;
					});
				}
			});
		},
		//destroy the plugin on the object and reset the object state
		destroy: function() {
			return this.each(function(){
				var $acObj = $(this);
				$acObj.removeData('richac');
			});
		}
	};
	
	//methods for internal plugin operations
	var privateMethods = {
		//show a plugin specific error
		showError: function(errorMessage) {
			$.error('aw20.richac: ' + errorMessage);
		},
		
		//runs a search based on the current capture to present the user with viable selections
		doSearch: function($acObj) {
			//get the search string and lowercase it
			var searchString = $acObj.val().toLowerCase();
			//find out which datasource we are using
			var thisSource = $acObj.data('richac').datasource;
			//check the search string has something to search
			if(searchString.length > 0) {
				//check this search does not match the last search
				if(searchString != $acObj.data('richac').lastSearch) {
					//make last search this one
					$acObj.data('richac').lastSearch = searchString;
					
					if (typeof(thisSource) == "string") {
						//get the data from ajax source
						$.ajax({
							async: true,
							cache: false,
							data: {searchQuery: searchString, categoryLimit: $acObj.data('richac').settings.categoryLimit, itemLimit: $acObj.data('richac').settings.itemLimit},
							error: function(xhr, status, error) {
								privateMethods.showError('ajax error - ' + status + ' - ' + error);
							},
							success: function(renderData) {
								privateMethods.renderUiItems($acObj, $.parseJSON(renderData), searchString);
							},
							timeout: 10000,
							type: "POST",
							url: thisSource
						});
					} else {
						//get the data from local source
						privateMethods.renderUiItems($acObj, thisSource, searchString);
					}
					//initialise selection system
					privateMethods.setSelection($acObj);
				}
			} else {
				//nothing to search so if we are allowed to close plugin
				if($acObj.data('richac').settings.closeOnBlank) {
					//close ui
					privateMethods.stopCompletionUi($acObj, true);
				}
			}
		},
		
		//renders the search appropriate data to the interface
		renderUiItems: function($acObj, data, searchString) {
			var acUi = $("#acui");
			var renderCount = 0;
			var categoryCount = 0;
			//clear all old results in the ui
			acUi.empty();
			//loop each category in the source
			$.each(data, function(catIndex, catElement) {
				if(categoryCount < $acObj.data('richac').settings.categoryLimit) {
					//reset item counter
					var itemCount = 0;
					//create category division
					var category = $("<div/>").attr("id", "acui_category");
					//create category items division
					var categoryItems = $("<div/>").attr("id", "acui_category_items");
					//append a category title division
					category.append($("<div/>").attr("id", "acui_category_title").text(catIndex));
					//append the category items division
					category.append(categoryItems);
					//loop each item for this category
					$.each(catElement, function(itemIndex, itemElement) {
						//if item contains search
						if(itemCount < $acObj.data('richac').settings.itemLimit) {
							itemElement.acfield_category = catIndex;
							var displayText = $acObj.data('richac').settings.onSearch(searchString, itemElement);
							
							if(displayText) {
								//create a new item
								var item = $("<div/>").attr({"id": "acui_item", "idSelect": renderCount}).data("itemData", itemElement).html(displayText);
								//add item to category
								categoryItems.append(item);
								//increment item counters
								renderCount++;
								itemCount++;
							}
						}
					});
					//if category has items
					if(itemCount > 0) {
						//add category to ui division
						acUi.append(category);
					}
					//increment category counters
					categoryCount++;
				}
			});
		},
		
		//a default search based on the label key of each element
		renderDefaultLocalSearch: function(searchString, itemElement, $acObj) {
			//default searches look for the label key item and check it contains the search string
			if(itemElement.label.indexOf(searchString) > -1) {
				//return the label item for display
				return itemElement.label;
			}
			//else dont display this item
			return false;
		},
		
		//called upon trigger key to render the selections menu and begin capture
		startCompletionUi: function($acObj) {
			//render selection menu placeholder
			var acUi = $("<div/>").attr("id", "acui");
			
			//set the item click selections to trigger the stop for this plugin (in case more than one on a page)
			$("#acui_item").live("click", function() {
				//set current selection
				$acObj.data('richac').currentSelection = $(this);
				//allow closing of the plugin again as a selection has been made
				$acObj.data('richac').blockClose = false;
				//stop plugin correctly with this selection
				privateMethods.stopCompletionUi($acObj);
			});
			
			//add selection division
			$acObj.after(acUi);
			
			//position the selection division
			acUi.css({
				width: $acObj.outerWidth() + "px",
				left: $acObj.position().left + "px",
				top: $acObj.position().top + $acObj.outerHeight() + "px"
			});
		},
		
		//called upon selection or cancel to end the ui
		stopCompletionUi: function($acObj, cancelSelection) {
			//option to stop the ui without any selections
			cancelSelection = cancelSelection != undefined ? cancelSelection : false;
			
			//clear any current search timeouts
			window.clearTimeout($acObj.data('richac').searchTrack);
			
			//reset last search
			$acObj.data('richac').lastSearch = "";
			
			//kill off the item mouse selection tracking for this plugin
			$("#acui_item").die("click");
			
			//if a selection should be made
			if(!cancelSelection) {
				//if plugin is active and a selection is defined
				if($acObj.data('richac').usage && $acObj.data('richac').currentSelection != undefined) {
					//get selection text
					var selection = $acObj.data('richac').currentSelection.text();
					//put chosen text into the field
					$acObj.val(selection);
					//trigger the custom callback for selections
					if($acObj.data('richac').settings.onSelect != null) {
						$acObj.data('richac').settings.onSelect($acObj.data('richac').currentSelection.data("itemData"));
					}
				} else {
					//nothing is active or selected, but run the callback with the current search string
					if($acObj.data('richac').settings.onSelect != null) {
						$acObj.data('richac').settings.onSelect($acObj.val());
					}
				}
			}
			
			//reset the selections
			$acObj.data('richac').currentSelection = undefined;
			//kill the ui
			$("#acui").empty().remove();
			
			//turn off the plugin state
			$acObj.data('richac').usage = false;
			
		},
		
		//updates the current selection to the user
		setSelection: function($acObj) {
			//deselect all items
			$(".acui_item_select").removeClass("acui_item_select");
			//show the selection for the item currently chosen
			if($acObj.data('richac').currentSelection != undefined) {
				$acObj.data('richac').currentSelection.addClass("acui_item_select");
			}
		}
	};
	
	//add rich autocomplete plugin to the jquery object
	$.fn.richac = function(method) {
		if (publicMethods[method]) {
			//if the user callable method exists within the context call the method
			return publicMethods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			//else if the argument was an object (for example a structure of options) we assume this is initialisation
			return publicMethods.init.apply(this, arguments);
		} else {
			//else inform the user of no such method
			privateMethods.showError('method ' +  method + ' does not exist.');
		}
	};
	
	//default settings
	$.fn.richac.defaults = {
		categoryLimit: 3,
		itemLimit: 4,
		minCharacters: 2,
		minDelay: 300,
		closeOnBlank: true,
		onSearch: privateMethods.renderDefaultLocalSearch,
		onSelect: null
	};

})(jQuery);
