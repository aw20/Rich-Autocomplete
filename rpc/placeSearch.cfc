<cfcomponent output="false" extends="baseSearch">
	
	<!--- called to return a query for the search --->
	<cffunction name="doSearch">
		<cfquery name="searchResult" datasource="search">
			select searchvalue as label from search2 where searchvalue like <cfqueryparam value="%#this.searchQuery#%" /> limit <cfqueryparam value="#this.itemLimit#" cfsqltype="cf_sql_integer" />;
		</cfquery>
		
		<cfreturn searchResult />
	</cffunction>
	
</cfcomponent>