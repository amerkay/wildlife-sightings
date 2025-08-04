// SPDX-License-Identifier: MIT
// Copyright contributors to the kepler.gl project

/** @jsxImportSource react */
import React, { useEffect } from "react";
import type { Dispatch } from "react";
import { connect, Provider } from "react-redux";

import { applyMiddleware, combineReducers, compose, createStore } from "redux";
import KeplerGl from "@kepler.gl/components";
import keplerGlReducer, {
  enhanceReduxMiddleware,
  type KeplerGlState,
  visStateUpdaters,
} from "@kepler.gl/reducers";
import { addDataToMap } from "@kepler.gl/actions";
import { processRowObject } from "@kepler.gl/processors";

import AutoSizer from "react-virtualized/dist/commonjs/AutoSizer";

// 1. Setup Redux store with keplerGl
const reducers = combineReducers({
  keplerGl: keplerGlReducer.initialState({
    uiState: { readOnly: false, currentModal: null },
  }),
});
const middleWares = enhanceReduxMiddleware([]);
const enhancers = applyMiddleware(...middleWares);
const store = createStore(reducers, {}, compose(enhancers));

interface KeplerMapProps {
  mapboxApiAccessToken: string;
  apiUrl: string;
  dispatch: Dispatch<any>;
}

const App: React.FC<KeplerMapProps> = ({
  mapboxApiAccessToken,
  apiUrl,
  dispatch,
}) => {
  useEffect(() => {
    // Fetch parsed observations from Nuxt API
    fetch(apiUrl)
      .then((res) => res.json())
      .then((data) => {
        dispatch(
          addDataToMap({
            // Kepler.gl expects an array of datasets
            datasets: [
              {
                info: { label: "Barn Owl Observations", id: "barn_owl_obs" },
                data: processRowObject(data) ?? { fields: [], rows: [] },
              },
            ],
            options: { centerMap: true, readOnly: false },
            config: {
              visState: {
                layers: [
                  {
                    id: "barn_owl_heatmap",
                    type: "heatmap",
                    config: {
                      dataId: "barn_owl_obs",
                      label: "Barn Owl Heatmap",
                      columns: { lat: "lat", lng: "lng" },
                      isVisible: true,
                      visConfig: { radius: 10 },
                    },
                  },
                ],
                filters: [
                  {
                    dataId: ["barn_owl_obs"],
                    id: "filter_eventDate",
                    name: ["eventDate"],
                    type: "timeRange",
                    value: [1659304800000, 1752962400000],
                    plotType: {
                      interval: "1-week",
                      defaultTimeFormat: "L",
                      type: "histogram",
                      aggregation: "sum",
                    },
                    yAxis: null,
                    animationWindow: "free",
                    view: "enlarged",
                    speed: 1,
                    enabled: true,
                  },
                ],
              },
            },
          })
        );
      });
  }, [apiUrl, dispatch]);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
    >
      <AutoSizer>
        {({ height, width }) => (
          <KeplerGl
            id="map"
            mapboxApiAccessToken={mapboxApiAccessToken}
            width={width}
            height={height}
          />
        )}
      </AutoSizer>
    </div>
  );
};

const mapStateToProps = (state: KeplerGlState) => state;
const dispatchToProps = (dispatch: Dispatch<any>) => ({ dispatch });
const ConnectedApp = connect(mapStateToProps, dispatchToProps)(App);

const KeplerMap: React.FC<{ mapboxApiAccessToken: string; apiUrl: string }> = (
  props
) => (
  <Provider store={store}>
    <ConnectedApp {...props} />
  </Provider>
);

export default KeplerMap;
