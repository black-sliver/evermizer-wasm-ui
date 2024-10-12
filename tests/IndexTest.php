<?php declare(strict_types=1);
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\TestCase;

// Test that main file produces correct output

final class IndexTest extends TestCase
{
    private ?string $src_dir;

    #[RunInSeparateProcess, PreserveGlobalState(false)]
    public function testNoArgsHTML(): void
    {
        $this->expectOutputRegex('/^<!DOCTYPE .*<html/is');
        require("$this->src_dir/index.php");
    }

    // TODO: more tests for various $_GET combinations

    protected function setUp(): void
    {
        parent::setUp();
        $this->src_dir = __DIR__ . '/..';
    }
}
