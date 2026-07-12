import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProbabilityList } from "@/components/classifier/ProbabilityList";

describe("ProbabilityList", () => {
  it("renders every class with its percentage, sorted by probability", () => {
    render(
      <ProbabilityList
        probabilities={{ Alpha: 0.1, Beta: 0.7, Gamma: 0.2 }}
        predictedClass="Beta"
      />,
    );

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("Beta");
    expect(items[0]).toHaveTextContent("70.0%");
    expect(items[1]).toHaveTextContent("Gamma");
    expect(items[2]).toHaveTextContent("Alpha");
  });
});
