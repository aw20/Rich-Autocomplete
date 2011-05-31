<cfcomponent output="false">
	
	<!--- called to initialise the search component --->
	<cffunction name="init">
		<cfargument name="searchQuery" />
		<cfargument name="itemLimit" />
		
		<cfset this.searchQuery = arguments.searchQuery />
		<cfset this.itemLimit = arguments.itemLimit />
		
		<cfreturn this />
	</cffunction>
	
</cfcomponent>