<cfcomponent output="false">
	
	<!--- DO NOT MODIFY THIS FUNCTION --->
	<cffunction name="runSearch" access="public" returnformat="JSON">
		<cfargument name="searchSets" required="true" />
		
		<cfset var threadCount = 0 />
		<cfloop array="#arguments.searchSets#" index="set">
			<cfset threadCount = threadCount + 1 />
			
			<cfthread action="run" name="t#threadCount#" dataSet="#set#">
				<cfset THREAD.searchSet = dataSet.label />
				<cfset THREAD.searchResult = dataSet.searchcfc.doSearch() />
				<cfset THREAD.dataResult = [] />
				
				<cfif isQuery(THREAD.searchResult)>
					<cfloop from="1" to="#THREAD.searchResult.recordCount#" index="queryRow">
						<cfset arrayAppend(THREAD.dataResult, queryRowStruct(THREAD.searchResult, queryRow)) />
					</cfloop>
				<cfelse>
					<cfset THREAD.dataResult = THREAD.searchResult />
				</cfif>
			</cfthread>
		</cfloop>

		<cfloop index="i" from="1" to="#threadCount#">
			<cfset threadJoin(cfThread["t#i#"], 5000)>
		</cfloop>

		<cfset returnData = {} />

		<cfloop index="i" from="1" to="#threadCount#">
			<cfset thisThread = cfThread["t#i#"] />
			<cfif arrayLen(thisThread.dataResult) GT 0>
				<cfset returnData[thisThread.searchSet] = thisThread.dataResult />
			</cfif>
		</cfloop>

		<cfreturn returnData />
	</cffunction>
	<!--- DO NOT MODIFY THIS FUNCTION --->

</cfcomponent>