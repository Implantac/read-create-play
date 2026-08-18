import { DataProvider } from "./DataProvider";
import { OfficialProvider, MockProvider } from "./Providers";

async function testDataProvider() {
  DataProvider.register(OfficialProvider);
  DataProvider.register(MockProvider);

  console.log("Active Origin:", DataProvider.getActiveOrigin());
  
  DataProvider.setActiveOrigin("mock");
  const result = await DataProvider.fetchDraws("lotofacil", 5);
  console.log("Mock Draws Count:", result.draws.length);
  console.log("Mock Origin:", result.origin);
}

// testDataProvider(); // Run manually if needed
