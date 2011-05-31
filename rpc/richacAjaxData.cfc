<cfcomponent output="false" extends="richacAjaxDataBase">
	
	<!--- this is called when a search is run --->
	<cffunction name="doSearch" access="remote" returnformat="JSON">
		<cfargument name="searchQuery" required="true" />
		<cfargument name="itemLimit" required="true" />
		
		<!--- configure the result set names and their custom search cfcs --->
		<cfset var searchSets = [
			{label: "People", searchcfc: createObject("component", "peopleSearch").init(arguments.searchQuery, arguments.itemLimit)},
			{label: "Places", searchcfc: createObject("component", "placeSearch").init(arguments.searchQuery, arguments.itemLimit)},
			{label: "Languages", searchcfc: createObject("component", "languageSearch").init(arguments.searchQuery, arguments.itemLimit)}
		] />
		
		<!--- pass the data sets to the runSearch function --->
		<cfset searchResult = runSearch(searchSets) />
		
		<!--- return results --->
		<cfreturn searchResult />
	</cffunction>
	
</cfcomponent>