import { describe, expect, it } from "vitest";
import { parseWorkOrders } from "./parse";

const HEADER =
  "WORK_ORDER_CAUSE,RESOLUTION,OBJECT_ID,WORK_ORDER_ID,DATE_INITIATED,ACTUAL_START_DATE,ACTUAL_FINISH_DATE,ASSET_TYPE,ASSET_GROUP,DESCRIPTION,PRIORITY,STATUS,STREET_CLASSIFICATION,QUANTITY,UNIT,ADDRESS,DISTRICT,X_COORDINATE,Y_COORDINATE,PROJECT_NAME,OLD_STATUS,NEW_STATUS,NEW_DESCRIPTION";

const ROWS = [
  `Ordinary Wear,,1,100,12/14/2018 12:00:00 PM,,,TRN_STREET,Right of Way,Road Shoulder - Grading,Medium,OPEN,MAJOR COLLECTOR,0,LINEAR METER,"880 WAVERLEY RD, WAVERLEY",1,-7074505.641,5579730.519,,Medium,Medium,"Unchanged: agrees (39%)."`,
  `,,2,101,01/02/2024 08:00:00 AM,,,TRN_SECTRAV,Right of Way,Asphalt Crosswalk - Asphalt Repair,Low,OPEN,ARTERIAL,0,,"370 PLEASANT ST, DARTMOUTH",5,-7076000,5577000,,Critical,High,"Low -> High: model predicts High (95%)."`,
  `,,3,102,bad date,,,AST_TREE,Tree,Pruning,,OPEN,,0,,"1 NOWHERE",,,,,,,"no coords"`,
];
const CSV = [HEADER, ...ROWS].join("\n");

describe("parseWorkOrders", () => {
  const { rows, skipped } = parseWorkOrders(CSV, new Date("2026-09-12"));

  it("maps columns", () => {
    expect(rows[0]).toMatchObject({
      id: "100", workType: "Road Shoulder - Grading", assetType: "TRN_STREET",
      address: "880 WAVERLEY RD, WAVERLEY", district: "1", streetClass: "MAJOR COLLECTOR",
      cause: "Ordinary Wear", oldStatus: "Medium", newStatus: "Medium", changed: false,
      dateInitiated: "2018-12-14", newDescription: "Unchanged: agrees (39%).",
    });
    expect(rows[0].lat).toBeCloseTo(44.73, 1);
    expect(rows[0].ageDays).toBe(2829);
  });

  it("maps Critical -> High and flags changed", () => {
    expect(rows[1].oldStatus).toBe("High");
    expect(rows[1].newStatus).toBe("High");
    expect(rows[1].changed).toBe(false);
  });

  it("skips rows without coords", () => {
    expect(rows).toHaveLength(2);
    expect(skipped).toBe(1);
  });
});
